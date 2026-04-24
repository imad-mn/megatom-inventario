<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Historial } from '@/servicios/modelos';
import { ObtenerHistorialPorElemento } from '@/servicios/historialService';

const props = defineProps<{ id: string, nombre: string }>();
const mostrar = defineModel<boolean>('mostrar');
const historial = ref<Historial[]>([]);

watch(
  () => props.id,
  async (newId: string) => {
    historial.value = [];
    historial.value = await ObtenerHistorialPorElemento(newId);
  },
  { immediate: true }
);
</script>
<template>
  <Dialog v-model:visible="mostrar" :header="`Historial de '${props.nombre}'`" :modal="true" class="w-full md:w-2xl">
    <DataView :value="historial">
      <template #list="{ items }">
        <div class="flex flex-col gap-2">
          <div
            v-for="(item, index) in items"
            :key="item.id"
            :class="['p-3 rounded-lg border border-surface-200 dark:border-surface-700', (index as number) % 2 === 0 ? 'bg-surface-50 dark:bg-surface-800' : 'bg-white dark:bg-surface-900']"
          >
            <!-- Fecha, usuario y acción -->
            <div class="flex flex-wrap items-center justify-between gap-1 mb-2">
              <span class="text-sm text-surface-500 dark:text-surface-400">
                {{ new Date(item.fechaCreacion).toLocaleString() }}
              </span>
              <div class="flex items-center gap-2">
                <Tag :value="item.usuario" severity="primary" />
                <Tag :value="item.accion" severity="info" />
              </div>
            </div>
            <!-- Anterior → Actual -->
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <div class="flex-1 min-w-0">
                <span class="text-xs font-semibold uppercase text-surface-400 dark:text-surface-500 block mb-0.5">Anterior</span>
                <span class="text-surface-700 dark:text-surface-200 break-words">{{ item.anterior ?? '—' }}</span>
              </div>
              <i class="pi pi-arrow-right text-surface-400 shrink-0" />
              <div class="flex-1 min-w-0">
                <span class="text-xs font-semibold uppercase text-surface-400 dark:text-surface-500 block mb-0.5">Actual</span>
                <span class="text-surface-700 dark:text-surface-200 break-words">{{ item.actual ?? '—' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <p class="text-center text-surface-400 py-6">Sin registros de historial.</p>
      </template>
    </DataView>
  </Dialog>
</template>
