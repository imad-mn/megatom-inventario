<script setup lang="ts">
import type { Historial } from '@/servicios/modelos.ts';
import { onMounted, ref, watch } from 'vue';
import { ExportarHistorial } from '@/servicios/ImportarExportar';
import { ObtenerHistorial } from '@/servicios/historialService';
import { useAuthStore } from '@/servicios/authStore';
import { FormatoFechaHora } from '@/servicios/sharedFunctions';

const authStore = useAuthStore();
const { Usuario } = authStore;

const historial = ref<Historial[]>([]);
const rangoFechas = ref<(Date | null)[]>([new Date(new Date().setDate(new Date().getDate() - 7)), new Date(new Date().setHours(23, 59))]);
const usuario = ref<string | null>(null);
const loading = ref(false);

async function cargarHistorial() {
  if (rangoFechas.value[0] && rangoFechas.value[1]) {
    try {
      loading.value = true;
      historial.value = await ObtenerHistorial(rangoFechas.value[0], rangoFechas.value[1], usuario.value);
    } finally {
      loading.value = false;
    }
  }
}

onMounted(async () => await cargarHistorial());

watch(rangoFechas, async () => {
  rangoFechas.value[0]?.setHours(0,0);
  rangoFechas.value[1]?.setHours(23,59);
  await cargarHistorial();
});

watch(usuario, async () => {
  await cargarHistorial();
});

async function DescargarHistorial() {
  const csv = await ExportarHistorial(historial.value);
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
  <div class="mx-auto max-w-3xl">
    <div class="flex flex-wrap gap-3 items-center mb-4">
      <div class="text-xl mr-3">HISTORIAL</div>
      <DatePicker v-model="rangoFechas" dateFormat="dd/mm/yy" show-icon selection-mode="range" />
      <div>
        <label for="usuario" class="mr-2">Usuario</label>
        <Select id="usuario" v-model="usuario" :options="['Imad', 'Giovanni', 'Angel Perez']" show-clear class="min-w-35 w-auto" />
      </div>
      <Button v-if="Usuario != null && Usuario.user.displayName != null && ['Imad', 'Giovanni'].includes(Usuario.user.displayName)" label="Exportar" icon="pi pi-file-export" severity="success" variant="outlined" @click="DescargarHistorial" v-tooltip.bottom="'Exportar historial a un archivo CSV'" />
    </div>

    <DataView :value="historial" :data-key="'id'" paginator :rows="5" :rows-per-page-options="[5, 10, 20]" :loading="loading">
      <template #list="{ items }">
        <div class="flex flex-col gap-2">
          <div
            v-for="(item, index) in items"
            :key="(item as Historial).id"
            :class="['p-3 rounded-lg border border-surface-200 dark:border-surface-700', (index as number) % 2 === 0 ? 'bg-surface-50 dark:bg-surface-800' : 'bg-white dark:bg-surface-900']"
          >
            <!-- Fecha, usuario y acción -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-sm text-surface-500 dark:text-surface-400">
                {{ FormatoFechaHora(item.fechaCreacion) }}
              </span>
              <Tag :value="(item as Historial).usuario" severity="primary" />
              <Tag :value="(item as Historial).accion" severity="info" />
            </div>
            <!-- Anterior → Actual -->
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <div class="flex-1 min-w-0">
                <span class="text-xs font-semibold uppercase text-surface-400 dark:text-surface-500 block mb-0.5">Anterior</span>
                <span class="text-surface-700 dark:text-surface-200 break-words">{{ (item as Historial).anterior ?? '—' }}</span>
              </div>
              <i class="pi pi-arrow-right text-surface-400 shrink-0" />
              <div class="flex-1 min-w-0">
                <span class="text-xs font-semibold uppercase text-surface-400 dark:text-surface-500 block mb-0.5">Actual</span>
                <span class="text-surface-700 dark:text-surface-200 break-words">{{ (item as Historial).actual ?? '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <p class="text-center text-surface-400 py-6">No se encontraron registros para el rango de fechas y/o usuario seleccionado.</p>
      </template>
    </DataView>
  </div>
</template>
