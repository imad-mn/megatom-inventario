<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Usuario } from '@/servicios/shared';
import type { Cantidades, Galpon, Lista, Movimientos, MovimientosExtendido, Producto } from '@/servicios/modelos';
import * as TablesDbService from '@/servicios/TablesDbService';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { Fieldset, FloatLabel } from 'primevue';
import { ObtenerUbicaciones } from '@/servicios/shared';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

interface CajaSimple {
  id: string,
  nombre: string,
  cantidad: number
}

const dialogVisible = ref(false);
const itemEdicion = ref<Movimientos | null>(null);
const movimientos = ref<MovimientosExtendido[]>([]);
const fechaDesde = ref<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
const fechaHasta = ref<Date>(new Date(new Date().setHours(23,59)));
const cargando = ref<boolean>(false);

const almacenistas = ref<Lista[]>([]);
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string | null>(null);
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);
const fabricanteDict = ref<Record<string, string>>({});
let cantidadesDelProducto: Cantidades[] = [];
const ubicacionesDelProducto = ref<string[]>([]);
const cajasDelProducto = ref<CajaSimple[]>([]);
const cajaDelProductoSeleccionada = ref<CajaSimple | null>(null);

const galponesData = ref<Galpon[]>([]);
const galponSeleccionado = ref<string | null>(null);
const estanteSeleccionado = ref<string | null>(null);
const nivelSeleccionado = ref<string | null>(null);
const seccionSeleccionada = ref<string | null>(null);
const cajaSeleccionada = ref<string | null>(null);
const galpones = computed(() => galponesData.value);
const estantes = computed(() => galponesData.value.find(g => g.id === galponSeleccionado.value)?.estantes ?? []);
const niveles = computed(() => estantes.value.find(e => e.id === estanteSeleccionado.value)?.niveles ?? []);
const secciones = computed(() => niveles.value.find(n => n.id === nivelSeleccionado.value)?.secciones ?? []);
const cajas = computed(() => secciones.value.find(s => s.id === seccionSeleccionada.value)?.cajas ?? []);


onMounted(async () => {
  cargando.value = true;
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
  almacenistas.value = TablesDbService.ObtenerLista('almacenistas');
  grupos.value = TablesDbService.ObtenerLista('grupos');
  const fabricantes = TablesDbService.ObtenerLista('fabricantes');
  fabricanteDict.value = Object.fromEntries(fabricantes.map(x => [x.id, x.nombre]));
  galponesData.value = await TablesDbService.ObtenerTodos<Galpon>('galpones');
  cargando.value = false;
});

watch(fechaDesde, async () => {
  cargando.value = true;
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
  cargando.value = false;
});

watch(fechaHasta, async () => {
  fechaHasta.value.setHours(23,59);
  cargando.value = true;
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
  cargando.value = false;
});

watch(grupoSeleccionado, async () => {
  if (grupoSeleccionado.value)
    productosDelGrupo.value = await TablesDbService.ObtenerProductosPorGrupo(grupoSeleccionado.value);
});

watch(productoSeleccionado, async () => {
  if (!productoSeleccionado.value || !itemEdicion.value)
    return;

  itemEdicion.value.productoId = productoSeleccionado.value.id;
  cantidadesDelProducto = await TablesDbService.ObtenerCantidadesPorProducto(productoSeleccionado.value?.id);
  ubicacionesDelProducto.value = await ObtenerUbicaciones(cantidadesDelProducto);
  cajasDelProducto.value = cantidadesDelProducto.map(c => ({
    id: c.cajaId,
    nombre:`Caja ${galponesData.value.flatMap(g => g.estantes).flatMap(e => e.niveles).flatMap(n => n.secciones).flatMap(s => s.cajas).find(x => x.id == c.cajaId)?.nombre ?? ''} (${c.cantidad} unidades)`,
    cantidad: c.cantidad
  }));
});

function Agregar() {
  dialogVisible.value = true;
  itemEdicion.value = { id: '', productoId: '', cantidad: 0, almacenistaId: '', justificacion: null, esIngreso: false, creadoPor: Usuario?.value?.user.displayName ?? '', fechaCreacion: new Date(), cajaId: '' };

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

  const cajaId = itemEdicion.value.esIngreso ? cajaSeleccionada.value : cajaDelProductoSeleccionada.value?.id;

  // Guarda el registro del movimiento
  await TablesDbService.CrearConFecha('movimientos', { ...itemEdicion.value, producto: productoSeleccionado.value?.id, caja: cajaId });

  // Actualiza la cantidad en cantidad existente o agrega a una caja
  let cantidadAModificar = cantidadesDelProducto.find(x => x.cajaId == cajaId);
  if (itemEdicion.value.esIngreso) {
    if (cantidadAModificar) {
      cantidadAModificar.cantidad += itemEdicion.value.cantidad;
      await TablesDbService.Actualizar('cantidades', cantidadAModificar);
    }
    else {
      cantidadAModificar = { id: '', productoId: productoSeleccionado.value.id, cantidad: itemEdicion.value.cantidad, cajaId: cajaId || ''};
      await TablesDbService.Crear('cantidades', cantidadAModificar);
    }
  } else {
    if (cantidadAModificar) {
      cantidadAModificar.cantidad -= itemEdicion.value.cantidad;
      await TablesDbService.Actualizar('cantidades', cantidadAModificar);
    }
  }

  dialogVisible.value = false;
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
}
</script>

<template>
  <div id="encabezado" class="flex flex-wrap items-center mb-4 gap-3">
    <div class="text-xl mr-5">MOVIMIENTOS</div>
    <div>
      <label for="fechaDesde" class="mr-2">Desde</label>
      <DatePicker v-model="fechaDesde" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    </div>
    <div>
      <label for="fechaHasta" class="mr-2">Hasta</label>
      <DatePicker v-model="fechaHasta" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    </div>
    <Button v-if="Usuario" label="Gestionar Inventario" icon="pi pi-arrow-right-arrow-left" severity="primary" variant="outlined" @click="Agregar" />
  </div>

  <DataTable :value="movimientos" show-gridlines striped-rows size="small" :paginator="movimientos.length > 10" :rows="10"
      :loading="cargando" sortField="fechaCreacion" :sortOrder="-1">
    <Column field="fechaCreacion" header="Fecha" style="width: 16%" sortable>
      <template #body="{ data }">
        {{ new Date(data.fechaCreacion).toLocaleString() }}
      </template>
    </Column>
    <Column field="esIngreso" header="Tipo" style="width: 7%" sortable>
      <template #body="{ data }">
        {{ data.esIngreso ? 'Ingreso' : 'Egreso' }}
      </template>
    </Column>
    <Column field="producto.nombre" header="Producto" style="width: 24%" sortable />
    <Column field="caja.nombre" header="Caja" style="width: 5%" sortable />
    <Column field="cantidad" header="Cantidad" style="width: 7%" sortable />
    <Column field="almacenista.nombre" header="Almacenista" style="width: 9%" sortable />
    <Column field="justificacion" header="Justificación" />
    <Column field="creadoPor" header="Creado por" style="width: 10%" sortable />
  </DataTable>

  <DialogoEdicion v-model:mostrar="dialogVisible" encabezado="Gestionar Inventario" :clickAceptar="Guardar" class="w-2xl"
    :desabilitarAceptar="itemEdicion?.productoId == null || itemEdicion?.cantidad === undefined || itemEdicion?.cantidad <= 0 || itemEdicion?.almacenistaId === null
    || (itemEdicion.esIngreso && cajaSeleccionada == null) || (!itemEdicion.esIngreso && (cajaDelProductoSeleccionada == null || cajaDelProductoSeleccionada.cantidad < itemEdicion.cantidad))">
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
          <div><b>Fabricante:&nbsp;</b>{{ fabricanteDict[productoSeleccionado?.fabricanteId] }}</div>
          <div><b>Peso Unitario:&nbsp;</b>{{ productoSeleccionado?.pesoUnitario?.toFixed(2) }} Kg</div>
          <ul class="list-disc list-inside">
            <li v-for="ubic in ubicacionesDelProducto" :key="ubic">{{ ubic }}</li>
          </ul>
        </div>
      </Fieldset>
      <div class="w-2/5 flex flex-col gap-3">
        <ToggleButton v-model="itemEdicion!.esIngreso" onLabel="Ingreso" offLabel="Egreso" off-icon="pi pi-arrow-left" on-icon="pi pi-arrow-right" />
        <FloatLabel variant="on">
          <Select id="almacenista" v-model="itemEdicion!.almacenistaId" :options="almacenistas" optionValue="id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.almacenistaId" />
          <label for="almacenista">Almacenista</label>
        </FloatLabel>
        <div v-if="itemEdicion!.esIngreso" class="flex flex-col gap-3">
          <FloatLabel variant="on">
            <Select v-model="galponSeleccionado" :options="galpones" optionLabel="nombre" optionValue="id" showClear class="w-full" />
            <label>Galpón</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="estanteSeleccionado" :options="estantes" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!galponSeleccionado" />
            <label>Estante</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="nivelSeleccionado" :options="niveles" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!estanteSeleccionado" />
            <label>Nivel</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="seccionSeleccionada" :options="secciones" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!nivelSeleccionado" />
            <label>Sección</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <Select v-model="cajaSeleccionada" :options="cajas" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!seccionSeleccionada" :invalid="cajaSeleccionada == null" />
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
