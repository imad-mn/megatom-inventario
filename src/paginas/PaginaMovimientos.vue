<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Usuario } from '@/servicios/appwrite';
import type { Cantidades, Lista, Movimientos, Producto } from '@/servicios/modelos';
import * as TablesDbService from '@/servicios/TablesDbService';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { Fieldset, FloatLabel } from 'primevue';
import { ObtenerUbicaciones } from '@/servicios/shared';

const dialogVisible = ref(false);
const itemEdicion = ref<Movimientos | null>(null);
const movimientos = ref<Movimientos[]>([]);
const fechaDesde = ref<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
const fechaHasta = ref<Date>(new Date());
const almacenistas = ref<Lista[]>([]);
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string>('');
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);
const fabricanteDict = ref<Record<string, string>>({});
const cantidadesDelProducto = ref<Cantidades[]>([]);
const ubicacionesDelProducto = ref<string[]>([]);
const cajasDelProducto = ref<{ id: string, nombre: string }[]>([]);

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
  cantidadesDelProducto.value = await TablesDbService.ObtenerCantidadesPorProducto(productoSeleccionado.value?.$id);
  ubicacionesDelProducto.value = ObtenerUbicaciones(cantidadesDelProducto.value);
  cajasDelProducto.value = cantidadesDelProducto.value.map(c => ({
    id: c.cajon,
    nombre:`Caja ${TablesDbService.Inventarios.value.find(x => x.$id == c.cajon)?.nombre ?? ''} (${c.cantidad} unidades)`,
  }));
});

function Agregar() {
  itemEdicion.value = { $id: '', producto: null, cantidad: 0, almacenista: null, justificacion: null, esIngreso: false, creadoPor: Usuario?.value?.name ?? '', $createdAt: '', caja: null };
  dialogVisible.value = true;
}

async function Guardar() {
  if (itemEdicion.value == null || productoSeleccionado.value == null)
    return;
  await TablesDbService.Crear('movimientos', { ...itemEdicion.value, producto: productoSeleccionado.value?.$id });
}
</script>

<template>
  <div id="encabezado" class="flex items-center mb-3 gap-3">
    <div class="text-xl mr-5">MOVIMIENTOS</div>
    <label for="fechaDesde">Desde</label>
    <DatePicker v-model="fechaDesde" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    <label for="fechaHasta">Hasta</label>
    <DatePicker v-model="fechaHasta" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    <Button v-if="Usuario" label="Gestionar Inventario" icon="pi pi-arrow-right-arrow-left" severity="primary" variant="outlined" @click="Agregar" />
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" encabezado="Gestionar Inventario" :clickAceptar="Guardar" class="w-2xl"
    :desabilitarAceptar="itemEdicion?.producto == null || itemEdicion?.cantidad === undefined || itemEdicion?.cantidad <= 0 || itemEdicion?.almacenista === null || (!itemEdicion.esIngreso && itemEdicion?.caja == null)">
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
          <Select id="cajas" v-model="itemEdicion!.caja" :options="cajasDelProducto" optionValue="id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.caja" />
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
