<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Historial, Paginacion } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import { ExportarHistorial } from '@/servicios/ImportarExportar';
import { Usuario } from '@/servicios/shared';

const historial = ref<Paginacion<Historial>>({ rows: [], lastVisibleDoc: null });
const currentPage = ref(0);
const rowsPerPage = ref(10);
const loading = ref(false);
const first = ref(0);
const totalRecords = ref(0);

async function cargarHistorial() {
  loading.value = true;
  historial.value = await TablesDbService.ObtenerHistorial(historial.value.lastVisibleDoc, rowsPerPage.value);
  loading.value = false;
}

onMounted(async () => {
  totalRecords.value = await TablesDbService.ObtenerConteoTotal(TablesDbService.Coleccion.Historial);
  await cargarHistorial();
});

function onPage(event: DataTablePageEvent) {
  first.value = event.first;
  if (event.first === 0) {
    historial.value.lastVisibleDoc = null; // Reiniciar paginación al ir a la primera página
  }
  rowsPerPage.value = event.rows;
  currentPage.value = event.first / event.rows;
  cargarHistorial();
}

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
  <div class="flex justify-between items-center mb-3">
    <div></div>
    <div class="text-xl mb-2 text-center">HISTORIAL</div>
    <div>
      <Button v-if="Usuario != null && Usuario.user.displayName != null && ['Imad', 'Giovanni'].includes(Usuario.user.displayName)" label="Exportar" icon="pi pi-file-export" severity="success" variant="outlined" @click="DescargarHistorial" v-tooltip.bottom="'Exportar historial a un archivo CSV'" />
    </div>
  </div>
  <DataTable :value="historial.rows" show-gridlines striped-rows size="small" paginator :first="first" :rows="rowsPerPage"
    :rows-per-page-options="[10, 20, 50]" :lazy="true" :loading="loading" :totalRecords="totalRecords" @page="onPage">
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
