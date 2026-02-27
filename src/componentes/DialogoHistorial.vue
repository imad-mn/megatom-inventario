<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ref, watch } from 'vue';
import type { Historial } from '@/servicios/modelos';

const props = defineProps<{ id: string, nombre: string }>();
const mostrar = defineModel<boolean>('mostrar');
const historial = ref<Historial[]>([]);

watch(
  () => props.id,
  async (newId: string) => historial.value = await TablesDbService.ObtenerHistorialPorElemento(newId),
  { immediate: true }
);
</script>
<template>
  <Dialog v-model:visible="mostrar" :header="`Historial de ${props.nombre}`" :modal="true" class="w-6xl">
    <DataTable :value="historial" striped-rows>
      <Column field="$createdAt" header="Fecha" style="width: 20%" sortable>
        <template #body="slotProps">
          {{ new Date(slotProps.data.$createdAt).toLocaleString() }}
        </template>
      </Column>
      <Column field="usuario" header="Usuario" style="min-width: 10%" />
      <Column field="accion" header="Acción" style="width: 20%" />
      <Column field="anterior" header="Anterior" style="width: 25%" />
      <Column field="actual" header="Actual" style="width: 25%" />
    </DataTable>
  </Dialog>
</template>
