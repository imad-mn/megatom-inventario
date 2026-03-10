<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Usuario } from '@/servicios/appwrite';
import type { Cantidades, Lista, Movimientos, MovimientosExtendido, Producto } from '@/servicios/modelos';
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
const fechaHasta = ref<Date>(new Date());
const almacenistas = ref<Lista[]>([]);
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string>('');
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);
const fabricanteDict = ref<Record<string, string>>({});
let cantidadesDelProducto: Cantidades[] = [];
const ubicacionesDelProducto = ref<string[]>([]);
const cajasDelProducto = ref<CajaSimple[]>([]);
const cajaSeleccionada = ref<CajaSimple | null>(null);

onMounted(async () => {
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
  almacenistas.value = TablesDbService.ObtenerLista('almacenistas');
  grupos.value = TablesDbService.ObtenerLista('grupos');
  const fabricantes = TablesDbService.ObtenerLista('fabricantes');
  fabricanteDict.value = Object.fromEntries(fabricantes.map(x => [x.$id, x.nombre]));
});

watch(fechaDesde, async () => {
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
});

watch(fechaHasta, async () => {
  movimientos.value = await TablesDbService.ObtenerMovimientos(fechaDesde.value, fechaHasta.value);
});

watch(grupoSeleccionado, async () => {
  productosDelGrupo.value = await TablesDbService.ObtenerProductosPorGrupo(grupoSeleccionado.value);
});

watch(productoSeleccionado, async () => {
  if (!productoSeleccionado.value || !itemEdicion.value)
    return;

  itemEdicion.value.producto = productoSeleccionado.value.$id;
  cantidadesDelProducto = await TablesDbService.ObtenerCantidadesPorProducto(productoSeleccionado.value?.$id);
  ubicacionesDelProducto.value = ObtenerUbicaciones(cantidadesDelProducto);
  cajasDelProducto.value = cantidadesDelProducto.map(c => ({
    id: c.cajon,
    nombre:`Caja ${TablesDbService.Inventarios.value.find(x => x.$id == c.cajon)?.nombre ?? ''} (${c.cantidad} unidades)`,
    cantidad: c.cantidad
  }));
});

function Agregar() {
  itemEdicion.value = { $id: '', producto: null, cantidad: 0, almacenista: null, justificacion: null, esIngreso: false, creadoPor: Usuario?.value?.name ?? '', $createdAt: '', caja: null };
  productoSeleccionado.value = null;
  cajaSeleccionada.value = null;
  dialogVisible.value = true;
}

async function Guardar() {
  // Validaciones
  if (itemEdicion.value == null || productoSeleccionado.value == null || (!itemEdicion.value.esIngreso && cajaSeleccionada.value == null))
    return;

  // Guarda el registro del movimiento
  await TablesDbService.Crear('movimientos', { ...itemEdicion.value, producto: productoSeleccionado.value?.$id, caja: cajaSeleccionada.value?.id });

  // Actualiza la cantidad en cantidad existente o agrega a una caja
  let cantidadAModificar: Cantidades | undefined;
  if (itemEdicion.value.esIngreso) {

  } else {
    cantidadAModificar = cantidadesDelProducto.find(x => x.cajon == cajaSeleccionada.value?.id);
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
  <div id="encabezado" class="flex items-center mb-4 gap-3">
    <div class="text-xl mr-5">MOVIMIENTOS</div>
    <label for="fechaDesde">Desde</label>
    <DatePicker v-model="fechaDesde" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    <label for="fechaHasta">Hasta</label>
    <DatePicker v-model="fechaHasta" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    <Button v-if="Usuario" label="Gestionar Inventario" icon="pi pi-arrow-right-arrow-left" severity="primary" variant="outlined" @click="Agregar" />
  </div>

  <DataTable :value="movimientos" show-gridlines striped-rows size="small">
    <Column field="$createdAt" header="Fecha" style="width: 14%">
      <template #body="{ data }">
        {{ new Date(data.$createdAt).toLocaleString() }}
      </template>
    </Column>
    <Column field="esIngreso" header="Tipo" style="width: 8%">
      <template #body="{ data }">
        {{ data.esIngreso ? 'Ingreso' : 'Egreso' }}
      </template>
    </Column>
    <Column field="producto" header="Producto" style="width: 10%">
      <template #body="{ data }">
        {{ data.producto?.nombre ?? '—' }}
      </template>
    </Column>
    <Column field="caja" header="Caja" style="width: 10%">
      <template #body="{ data }">
        {{ data.caja?.nombre ?? '—' }}
      </template>
    </Column>
    <Column field="cantidad" header="Cantidad" style="width: 8%" />
    <Column field="almacenista" header="Almacenista" style="width: 12%">
      <template #body="{ data }">
        {{ data.almacenista?.nombre ?? '—' }}
      </template>
    </Column>
    <Column field="justificacion" header="Justificación" />
    <Column field="creadoPor" header="Creado por" style="width: 10%" />
  </DataTable>

  <DialogoEdicion v-model:mostrar="dialogVisible" encabezado="Gestionar Inventario" :clickAceptar="Guardar" class="w-2xl"
    :desabilitarAceptar="itemEdicion?.producto == null || itemEdicion?.cantidad === undefined || itemEdicion?.cantidad <= 0 || itemEdicion?.almacenista === null || (!itemEdicion.esIngreso && cajaSeleccionada == null)">
    <div class="flex gap-3">
      <Fieldset legend="Producto" class="w-3/5 p-3" :pt="{ contentWrapper: 'min-w-0' }">
        <FloatLabel variant="on" class="mb-3">
          <Select id="grupo" v-model="grupoSeleccionado" :options="grupos" optionValue="$id" optionLabel="nombre" class="w-full" />
          <label for="grupo">Grupo</label>
        </FloatLabel>
        <FloatLabel variant="on" class="mb-2">
          <Select id="producto" v-model="productoSeleccionado" :options="productosDelGrupo" optionLabel="nombre" class="w-full" />
          <label for="producto">Producto</label>
        </FloatLabel>
        <div v-if="productoSeleccionado">
          <div><b>Código:&nbsp;</b>{{ productoSeleccionado?.codigo }}</div>
          <div><b>Descripción:&nbsp;</b>{{ productoSeleccionado?.descripcion }}</div>
          <div><b>Fabricante:&nbsp;</b>{{ fabricanteDict[productoSeleccionado?.fabricante] }}</div>
          <div><b>Peso Unitario:&nbsp;</b>{{ productoSeleccionado?.pesoUnitario?.toFixed(2) }} Kg</div>
          <ul class="list-disc list-inside">
            <li v-for="ubic in ubicacionesDelProducto" :key="ubic">{{ ubic }}</li>
          </ul>
        </div>
      </Fieldset>      
      <div class="w-2/5 flex flex-col gap-3">
        <ToggleButton v-model="itemEdicion!.esIngreso" onLabel="Ingreso" offLabel="Egreso" off-icon="pi pi-arrow-left" on-icon="pi pi-arrow-right" />
        <FloatLabel variant="on">
          <Select id="almacenista" v-model="itemEdicion!.almacenista" :options="almacenistas" optionValue="$id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.almacenista" />
          <label for="almacenista">Almacenista</label>
        </FloatLabel>
        <FloatLabel variant="on" v-if="!itemEdicion!.esIngreso">
          <Select id="cajas" v-model="cajaSeleccionada" :options="cajasDelProducto" optionLabel="nombre" class="w-full" :invalid="cajaSeleccionada == null" />
          <label for="cajas">Cajas</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputNumber id="cantidad" v-model="itemEdicion!.cantidad" :min="0" class="w-full" :invalid="!itemEdicion?.cantidad" />
          <label for="cantidad">Cantidad</label>
        </FloatLabel>
        <FloatLabel variant="on">        
          <Textarea id="justificacion" v-model="itemEdicion!.justificacion" class="w-full" maxlength="100" :rows="2" auto-resize />
          <label for="justificacion">Justificación (máx. 100 caracteres)</label>
        </FloatLabel>
      </div>
    </div>
  </DialogoEdicion>
</template>
