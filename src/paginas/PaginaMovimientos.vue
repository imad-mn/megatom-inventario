<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Caja, Cantidades, Estante, Galpon, IdNombre, Lista, Movimientos, MovimientosExtendido, Nivel, Producto, Seccion } from '@/servicios/modelos';
import { Actualizar, Coleccion, Crear, CrearConFecha, Eliminar, ObtenerConFiltroFecha } from '@/servicios/TablesDbService';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { Fieldset, FloatLabel } from 'primevue';
import { useGlobalStore } from '@/servicios/globalStore';
import { useAuthStore } from '@/servicios/authStore';

const globalStore = useGlobalStore();
const authStore = useAuthStore();
const { Usuario } = authStore;

interface CajaSimple {
  id: string,
  nombre: string,
  cantidad: number
}

const dialogVisible = ref(false);
const itemEdicion = ref<Movimientos | null>(null);
const movimientos = ref<MovimientosExtendido[]>([]);
const rangoFechas = ref<(Date | null)[]>([new Date(new Date().setDate(new Date().getDate() - 7)), new Date(new Date().setHours(23,59))]);
const cargando = ref<boolean>(false);

const almacenistas = ref<Lista[]>([]);
let almacenistasMap: Map<string, Lista>;
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string | null>(null);

let productosMap: Map<string, Producto>;
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);

let cantidadesDelProducto: Cantidades[] = [];
const ubicacionesDelProducto = ref<string[]>([]);
const cajasDelProducto = ref<CajaSimple[]>([]);
const cajaDelProductoSeleccionada = ref<CajaSimple | null>(null);

const galponSeleccionado = ref<Galpon | null>(null);
const estanteSeleccionado = ref<Estante | null>(null);
const nivelSeleccionado = ref<Nivel | null>(null);
const seccionSeleccionada = ref<Seccion | null>(null);
const cajaSeleccionada = ref<Caja | null>(null);
let cajasMap: Map<string, IdNombre>;

onMounted(async () => {
  cargando.value = true;

  almacenistas.value = globalStore.ObtenerLista('almacenistas');
  almacenistasMap = new Map(almacenistas.value.map(a => [a.id, a]));

  grupos.value = globalStore.ObtenerLista('grupos');

  productosMap = new Map(globalStore.Productos.map(p => [p.id, p]));

  cajasMap = new Map();
  for (const galpon of globalStore.Galpones) {
    for (const estante of galpon.estantes) {
      for (const nivel of estante.niveles) {
        for (const seccion of nivel.secciones) {
          for (const caja of seccion.cajas) {
            cajasMap.set(caja.id, caja);
          }
        }
      }
    }
  }

  await ObtenerMovimientos();
  cargando.value = false;
});

async function ObtenerMovimientos(): Promise<void> {
  if (!rangoFechas.value[0] || !rangoFechas.value[1])
    return;
  cargando.value = true;
  const movimientosDB = await ObtenerConFiltroFecha<Movimientos>(Coleccion.Movimientos, rangoFechas.value[0], rangoFechas.value[1], []);
  cargando.value = false;
  movimientos.value = movimientosDB.map(movimiento => ({
    ...movimiento,
    producto: movimiento.productoId ? productosMap.get(movimiento.productoId) || null : null,
    caja: movimiento.cajaId ? cajasMap.get(movimiento.cajaId) || null : null,
    almacenista: movimiento.almacenistaId ? almacenistasMap.get(movimiento.almacenistaId) || null : null,
  }));
}

watch(rangoFechas, async () => {
  rangoFechas.value[0]?.setHours(0,0);
  rangoFechas.value[1]?.setHours(23,59);
  await ObtenerMovimientos();
});

watch(grupoSeleccionado, async () => {
  if (grupoSeleccionado.value)
    productosDelGrupo.value = globalStore.Productos.filter(p => p.grupoId === grupoSeleccionado.value);
});

watch(productoSeleccionado, async () => {
  if (!productoSeleccionado.value || !itemEdicion.value)
    return;

  itemEdicion.value.productoId = productoSeleccionado.value.id;
  cantidadesDelProducto = globalStore.ObtenerCantidadesPorProducto(productoSeleccionado.value?.id);
  ubicacionesDelProducto.value = globalStore.ObtenerUbicaciones(cantidadesDelProducto);
  cajasDelProducto.value = cantidadesDelProducto.map(c => ({
    id: c.cajaId,
    nombre:`Caja ${globalStore.Galpones.flatMap(g => g.estantes).flatMap(e => e.niveles).flatMap(n => n.secciones).flatMap(s => s.cajas).find(x => x.id == c.cajaId)?.nombre ?? ''} (${c.cantidad} unidades)`,
    cantidad: c.cantidad
  }));
});

function Agregar() {
  dialogVisible.value = true;
  itemEdicion.value = { id: '', productoId: '', cantidad: 0, almacenistaId: '', justificacion: null, esIngreso: false, creadoPor: Usuario?.user.displayName ?? '', fechaCreacion: new Date(), cajaId: '' };

  grupoSeleccionado.value = null;
  productoSeleccionado.value = null;
  cajasDelProducto.value = [];
  cajaDelProductoSeleccionada.value = null;
}

async function Guardar() {
  // Validaciones
  if (itemEdicion.value == null || productoSeleccionado.value == null
    || (!itemEdicion.value.esIngreso && (cajaDelProductoSeleccionada.value == null || cajaDelProductoSeleccionada.value.cantidad < itemEdicion.value.cantidad))
    || (itemEdicion.value.esIngreso && cajaSeleccionada.value == null))
    return;

  const cajaId = itemEdicion.value.esIngreso ? cajaSeleccionada.value?.id : cajaDelProductoSeleccionada.value?.id;

  // Guarda el registro del movimiento
  await CrearConFecha(Coleccion.Movimientos, { ...itemEdicion.value, productoId: productoSeleccionado.value?.id, cajaId: cajaId });

  // Actualiza la cantidad en cantidad existente o agrega a una caja
  let cantidadAModificar = cantidadesDelProducto.find(x => x.cajaId == cajaId);
  if (itemEdicion.value.esIngreso) {
    if (cantidadAModificar) {
      cantidadAModificar.cantidad += itemEdicion.value.cantidad;
      await Actualizar(Coleccion.Cantidades, cantidadAModificar);
    }
    else {
      cantidadAModificar = { id: '', productoId: productoSeleccionado.value.id, cantidad: itemEdicion.value.cantidad, cajaId: cajaId || ''};
      await Crear(Coleccion.Cantidades, cantidadAModificar);
    }
  } else {
    if (cantidadAModificar) {
      cantidadAModificar.cantidad -= itemEdicion.value.cantidad;
      if (cantidadAModificar.cantidad == 0)
        await Eliminar(Coleccion.Cantidades, cantidadAModificar);
      else
        await Actualizar(Coleccion.Cantidades, cantidadAModificar);
    }
  }

  dialogVisible.value = false;
  await ObtenerMovimientos();
}
</script>

<template>
  <div id="encabezado" class="flex flex-wrap items-center mb-4 gap-3">
    <div class="text-xl mr-5">MOVIMIENTOS</div>
    <DatePicker v-model="rangoFechas" dateFormat="dd/mm/yy" show-icon selection-mode="range" />
    <Button v-if="Usuario" label="Gestionar Inventario" icon="pi pi-arrow-right-arrow-left" severity="primary" variant="outlined" @click="Agregar" />
  </div>

  <DataView :value="movimientos" data-key="id" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" :loading="cargando">
    <template #list="{ items }">
      <div class="flex flex-col gap-2">
        <div
          v-for="(item, index) in (items as MovimientosExtendido[])"
          :key="item.id"
          :class="['p-3 rounded-lg border border-surface-200 dark:border-surface-700', (index as number) % 2 === 0 ? 'bg-surface-50 dark:bg-surface-800' : 'bg-white dark:bg-surface-900']"
        >
          <!-- Fila superior: fecha, tipo, creado por -->
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <span class="text-sm text-surface-500 dark:text-surface-400">
              {{ new Date(item.fechaCreacion).toLocaleString() }}
            </span>
            <Tag :value="item.esIngreso ? 'Ingreso' : 'Egreso'" :severity="item.esIngreso ? 'success' : 'danger'" />
            <span class="font-semibold text-surface-700 dark:text-surface-200 break-words">{{ item.producto?.nombre ?? '—' }}</span>
            <span class="text-surface-400 dark:text-surface-500 ml-auto">{{ item.creadoPor }}</span>
          </div>
          <!-- Fila del producto -->
          <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm mb-1">
            <span class="text-surface-500 dark:text-surface-400">Caja: <b>{{ item.caja?.nombre ?? '—' }}</b></span>
            <span class="text-surface-500 dark:text-surface-400">Cantidad: <b>{{ item.cantidad }}</b></span>
            <span class="text-surface-500 dark:text-surface-400">Almacenista: <b>{{ item.almacenista?.nombre ?? '—' }}</b></span>
          </div>
          <!-- Justificación (solo si existe) -->
          <div v-if="item.justificacion" class="text-surface-400 dark:text-surface-500 italic">
            {{ item.justificacion }}
          </div>
        </div>
      </div>
    </template>
    <template #empty>
      <p class="text-center text-surface-400 py-6">No se encontraron movimientos para el rango de fechas seleccionado.</p>
    </template>
  </DataView>

  <DialogoEdicion v-model:mostrar="dialogVisible" encabezado="Gestionar Inventario" :clickAceptar="Guardar" class="w-2xl"
    :desabilitarAceptar="itemEdicion?.productoId == null || itemEdicion?.cantidad === undefined || itemEdicion?.cantidad <= 0 || itemEdicion?.almacenistaId === null
    || (itemEdicion.esIngreso && cajaSeleccionada == null) || (!itemEdicion.esIngreso && (cajaDelProductoSeleccionada == null || cajaDelProductoSeleccionada.cantidad < itemEdicion.cantidad))">
    <div class="flex justify-center">
      <ToggleButton v-model="itemEdicion!.esIngreso" onLabel="Ingreso" offLabel="Egreso" off-icon="pi pi-arrow-left" on-icon="pi pi-arrow-right" />
    </div>
    <div class="flex gap-3">
      <Fieldset legend="Producto" class="w-3/5 p-3" :pt="{ contentWrapper: 'min-w-0' }">
        <FloatLabel variant="on" class="mb-3">
          <Select id="grupo" v-model="grupoSeleccionado" :options="grupos" optionValue="id" optionLabel="nombre" class="w-full" />
          <label for="grupo">Grupo</label>
        </FloatLabel>
        <FloatLabel variant="on" class="mb-2">
          <Select id="producto" v-model="productoSeleccionado" :options="productosDelGrupo" optionLabel="nombre" class="w-full" />
          <label for="producto">Producto</label>
        </FloatLabel>
        <div v-if="productoSeleccionado">
          <div><b>Código:&nbsp;</b>{{ productoSeleccionado?.codigo }}</div>
          <div><b>Descripción:&nbsp;</b>{{ productoSeleccionado?.descripcion }}</div>
          <div><b>Fabricante:&nbsp;</b>{{ productoSeleccionado?.fabricanteId ? globalStore.ListasMap[productoSeleccionado?.fabricanteId] : ''}}</div>
          <div><b>Peso Unitario:&nbsp;</b>{{ productoSeleccionado?.pesoUnitario?.toFixed(2) }} Kg</div>
          <ul class="list-disc list-inside">
            <li v-for="ubic in ubicacionesDelProducto" :key="ubic">{{ ubic }}</li>
          </ul>
        </div>
      </Fieldset>
      <div class="w-2/5 flex flex-col gap-3 mt-5">
        <FloatLabel variant="on">
          <Select id="almacenista" v-model="itemEdicion!.almacenistaId" :options="almacenistas" optionValue="id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.almacenistaId" />
          <label for="almacenista">Almacenista</label>
        </FloatLabel>
        <div v-if="itemEdicion!.esIngreso" class="flex flex-col gap-3">
          <FloatLabel variant="on">
            <Select v-model="galponSeleccionado" :options="globalStore.Galpones" :optionLabel="(data: Galpon) => `${data.nombre} - ${data.descripcion}`" showClear class="w-full" />
            <label>Galpón</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="estanteSeleccionado" :options="galponSeleccionado?.estantes" optionLabel="nombre" showClear class="w-full" :disabled="!galponSeleccionado" />
            <label>Estante</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="nivelSeleccionado" :options="estanteSeleccionado?.niveles" optionLabel="nombre" showClear class="w-full" :disabled="!estanteSeleccionado" />
            <label>Nivel</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="seccionSeleccionada" :options="nivelSeleccionado?.secciones" optionLabel="nombre" showClear class="w-full" :disabled="!nivelSeleccionado" />
            <label>Sección</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="cajaSeleccionada" :options="seccionSeleccionada?.cajas" optionLabel="nombre" showClear class="w-full" :disabled="!seccionSeleccionada" :invalid="cajaSeleccionada == null" />
            <label>Caja</label>
          </FloatLabel>
        </div>
        <FloatLabel v-else variant="on">
          <Select id="cajas" v-model="cajaDelProductoSeleccionada" :options="cajasDelProducto" optionLabel="nombre" class="w-full" :invalid="cajaDelProductoSeleccionada == null" />
          <label for="cajas">Caja</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputNumber id="cantidad" v-model="itemEdicion!.cantidad" :min="0" class="w-full" :invalid="!itemEdicion?.cantidad || itemEdicion.cantidad <= 0 || (!itemEdicion.esIngreso && cajaDelProductoSeleccionada != null && itemEdicion.cantidad > cajaDelProductoSeleccionada?.cantidad)" />
          <label for="cantidad">Cantidad</label>
          <Message v-if="itemEdicion != null && cajaDelProductoSeleccionada != null && !itemEdicion.esIngreso && itemEdicion.cantidad > cajaDelProductoSeleccionada.cantidad" severity="error" size="small" variant="simple">La cantidad no puede ser mayor al contenido de la caja</Message>
        </FloatLabel>
        <FloatLabel variant="on">
          <Textarea id="justificacion" v-model="itemEdicion!.justificacion" class="w-full" maxlength="100" :rows="2" auto-resize />
          <label for="justificacion">Justificación</label>
        </FloatLabel>
      </div>
    </div>
  </DialogoEdicion>
</template>
