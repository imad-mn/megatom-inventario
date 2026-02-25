<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Historial } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DataTable, { type DataTableFilterMeta, type DataTablePageEvent, type DataTableSortEvent } from 'primevue/datatable';
import Column from 'primevue/column';

const historial = ref<Historial[]>([]);
const currentPage = ref(0);
const rowsPerPage = ref(10);
const loading = ref(false);
const totalRecords = ref(0);
const sortOrder = ref<1 | 0 | -1>(-1);
const first = ref(0);
const filters = ref<DataTableFilterMeta>({
  usuario: { value: null, matchMode: 'equals' },
  accion: { value: null, matchMode: 'contains' },
});
const usuarios = TablesDbService.ObtenerLista('usuario').map(x => x.nombre);

async function cargarHistorial() {
  loading.value = true;
  try {
    const respuesta = await TablesDbService.ObtenerConPaginacion<Historial>('Historial', currentPage.value, rowsPerPage.value, sortOrder.value, filters.value);
    totalRecords.value = respuesta.total;
    historial.value = respuesta.rows;
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
</script>

<template>
  <div class="text-2xl mb-4 text-center">HISTORIAL</div>
  <DataTable :value="historial" striped-rows paginator :first="first" :rows="rowsPerPage" :rows-per-page-options="[10, 20, 50]"
    :lazy="true" :loading="loading" :totalRecords="totalRecords" @page="onPage" @sort="onSort"
    @filter="onFilter" filter-display="row" v-model:filters="filters">
    <Column field="$createdAt" header="Fecha" style="width: 20%" sortable>
      <template #body="slotProps">
        {{ new Date(slotProps.data.$createdAt).toLocaleString() }}
      </template>
    </Column>
    <Column field="usuario" header="Usuario" style="min-width: 15%" :showFilterMenu="false">
      <template #filter="{ filterModel, filterCallback }">
        <Select id="usuario" v-model="filterModel.value" :options="usuarios" showClear fluid  @change="filterCallback()" />
      </template>
    </Column>
    <Column field="accion" header="Acción" style="width: 65%" :showFilterMenu="false">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="search" placeholder="Buscar..." @input="filterCallback()" fluid />
      </template>
    </Column>
  </DataTable>
</template>
