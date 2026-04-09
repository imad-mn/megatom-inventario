<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Historial } from '@/servicios/modelos.ts';
import { onMounted, ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ExportarHistorial } from '@/servicios/ImportarExportar';
import { Usuario } from '@/servicios/shared';

const historial = ref<Historial[]>([]);
const fechaDesde = ref<Date>(new Date(new Date().setDate(new Date().getDate() - 7)));
const fechaHasta = ref<Date>(new Date(new Date().setHours(23,59)));
const usuario = ref<string | null>(null);
const loading = ref(false);

async function cargarHistorial() {
  try {
    loading.value = true;
    historial.value = await TablesDbService.ObtenerHistorial(fechaDesde.value, fechaHasta.value, usuario.value);
  } catch (error) {
    console.error('Error al cargar el historial:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await cargarHistorial();
});

watch(fechaDesde, async () => {
  fechaDesde.value.setHours(0,0);
  await cargarHistorial();
});

watch(fechaHasta, async () => {
  fechaHasta.value.setHours(23,59);
  await cargarHistorial();
});

watch(usuario, async () => {
  await cargarHistorial();
});

async function DescargarHistorial() {
  const csv = await ExportarHistorial();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Historial-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="flex flex-wrap gap-3 items-center mb-4">
    <div class="text-xl mr-5">HISTORIAL</div>
    <div>
      <label for="usuario" class="mr-2">Usuario</label>
      <Select id="usuario" v-model="usuario" :options="['Imad', 'Giovanni']" show-clear />
    </div>
    <div>
      <label for="fechaDesde" class="mr-2">Desde</label>
      <DatePicker v-model="fechaDesde" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    </div>
    <div>
      <label for="fechaHasta" class="mr-2">Hasta</label>
      <DatePicker v-model="fechaHasta" dateFormat="dd/mm/yy" show-icon :pt="{ pcInputText: { root: 'w-28' } }" />
    </div>
    <Button v-if="Usuario != null && Usuario.user.displayName != null && ['Imad', 'Giovanni'].includes(Usuario.user.displayName)" label="Exportar" icon="pi pi-file-export" severity="success" variant="outlined" @click="DescargarHistorial" v-tooltip.bottom="'Exportar historial a un archivo CSV'" />
  </div>

  <DataTable :value="historial" show-gridlines striped-rows size="small" :paginator="historial.length > 10" :rows="10"
    :rows-per-page-options="[10, 20, 50]" :loading="loading"
    :empty-message="'No se encontraron registros para el rango de fechas y/o usuario seleccionado.'">
    <Column field="fechaCreacion" header="Fecha" style="width: 16%" :pt="{ columnHeaderContent: 'justify-center' }">
      <template #body="slotProps">
        {{ new Date(slotProps.data.fechaCreacion).toLocaleString() }}
      </template>
    </Column>
    <Column field="usuario" header="Usuario" style="max-width: 12%" :showFilterMenu="false" />
    <Column field="accion" header="Acción" style="width: 20%" :showFilterMenu="false" :pt="{ columnHeaderContent: 'justify-center' }" />
    <Column field="anterior" header="Anterior" style="max-width: 25%" :showFilterMenu="false" :pt="{ columnHeaderContent: 'justify-center' }" />
    <Column field="actual" header="Actual" style="max-width: 25%" :showFilterMenu="false" :pt="{ columnHeaderContent: 'justify-center' }" />
  </DataTable>
</template>
