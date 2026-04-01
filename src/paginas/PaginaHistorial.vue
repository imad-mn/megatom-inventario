<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Historial, Paginacion } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DataTable, { type DataTableFilterMeta, type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import { ExportarHistorial } from '@/servicios/ImportarExportar';
import { Usuario } from '@/servicios/shared';

const historial = ref<Paginacion<Historial>>({ total: 0, rows: [], lastVisibleDoc: null });
const currentPage = ref(0);
const rowsPerPage = ref(10);
const loading = ref(false);
const sortOrder = ref<1 | 0 | -1>(-1);
const first = ref(0);
const filters = ref<DataTableFilterMeta>({
  usuario: { value: null, matchMode: 'equals' },
  accion: { value: null, matchMode: 'contains' },
  anterior: { value: null, matchMode: 'contains' },
  actual: { value: null, matchMode: 'contains' },
});
const usuarios = TablesDbService.ObtenerLista('usuario').map(x => x.nombre);

async function cargarHistorial() {
  loading.value = true;
  try {
    historial.value = await TablesDbService.ObtenerHistorial(historial.value.lastVisibleDoc, rowsPerPage.value, sortOrder.value, filters.value);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await cargarHistorial();
});

function onPage(event: DataTablePageEvent) {
  first.value = event.first;
  currentPage.value = event.first / rowsPerPage.value;
  rowsPerPage.value = event.rows;
  cargarHistorial();
}

function onSort(event: DataTableSortEvent) {
  sortOrder.value = event.sortOrder ?? 0;
  cargarHistorial();
}

function onFilter() {
  first.value = 0;
  currentPage.value = 0;
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
    <Button v-if="Usuario != null && Usuario.user.displayName != null && ['Imad', 'Giovanni'].includes(Usuario.user.displayName)" label="Exportar" icon="pi pi-file-export" severity="success" variant="outlined" @click="DescargarHistorial" v-tooltip.bottom="'Exportar historial a un archivo CSV'" />
  </div>
  <DataTable :value="historial.rows" show-gridlines striped-rows size="small" paginator :first="first" :rows="rowsPerPage" :rows-per-page-options="[10, 20, 50]"
    :lazy="true" :loading="loading" :totalRecords="historial.total" @page="onPage" @sort="onSort"
    @filter="onFilter" filter-display="row" v-model:filters="filters">
    <Column field="fechaCreacion" header="Fecha" style="width: 18%" sortable :pt="{ columnHeaderContent: 'justify-center' }">
      <template #body="slotProps">
        {{ new Date(slotProps.data.fechaCreacion).toLocaleString() }}
      </template>
    </Column>
    <Column field="usuario" header="Usuario" style="max-width: 12%" :showFilterMenu="false">
      <template #filter="{ filterModel, filterCallback }">
        <Select id="usuario" v-model="filterModel.value" :options="usuarios" showClear fluid  @change="filterCallback()" />
      </template>
    </Column>
    <Column field="accion" header="Acción" style="width: 20%" :showFilterMenu="false" :pt="{ columnHeaderContent: 'justify-center' }">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="search" placeholder="Buscar..." @input="filterCallback()" fluid />
      </template>
    </Column>
    <Column field="anterior" header="Anterior" style="max-width: 25%" :showFilterMenu="false" :pt="{ columnHeaderContent: 'justify-center' }">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="search" placeholder="Buscar..." @input="filterCallback()" fluid />
      </template>
    </Column>
    <Column field="actual" header="Actual" style="width: 25%" :showFilterMenu="false" :pt="{ columnHeaderContent: 'justify-center' }">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="search" placeholder="Buscar..." @input="filterCallback()" fluid />
      </template>
    </Column>
  </DataTable>
</template>
