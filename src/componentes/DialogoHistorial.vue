<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Historial } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps<{ id: string }>();
const mostrar = defineModel<boolean>('mostrar');
const historial = ref<Historial[]>([]);

onMounted(async () => historial.value = await TablesDbService.ObtenerHistorialPorElemento(props.id));

</script>
<template>
  <Dialog v-model:visible="mostrar" header="HISTORIAL" :modal="true" class="w-lg">
    <DataTable :value="historial" striped-rows>
      <Column field="$createdAt" header="Fecha" style="width: 20%" sortable>
        <template #body="slotProps">
          {{ new Date(slotProps.data.$createdAt).toLocaleString() }}
        </template>
      </Column>
      <Column field="usuario" header="Usuario" style="min-width: 15%" />
      <Column field="accion" header="Acción" style="width: 65%" />
    </DataTable>
  </Dialog>
</template>
