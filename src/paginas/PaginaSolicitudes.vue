<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { Solicitud } from '@/servicios/modelos';
import { Coleccion, ObtenerConFiltroFecha } from '@/servicios/TablesDbService';
import { useGlobalStore } from '@/servicios/globalStore';
import { where } from 'firebase/firestore';

const globalStore = useGlobalStore();

const filtro = ref<'No procesadas' | 'Procesadas'>('No procesadas');
const rangoFechas = ref<(Date | null)[]>([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date(new Date().setHours(23, 59))
]);
const solicitudes = ref<Solicitud[]>([]);
const cargando = ref(false);

const productosMap = computed(() => new Map(globalStore.Productos.map(p => [p.id, p])));

async function cargar() {
  if (!rangoFechas.value[0] || !rangoFechas.value[1]) return;
  cargando.value = true;
  try {
    const procesada = filtro.value === 'Procesadas';
    solicitudes.value = await ObtenerConFiltroFecha<Solicitud>(
      Coleccion.Solicitudes,
      rangoFechas.value[0],
      rangoFechas.value[1],
      [where('procesada', '==', procesada)]
    );
  } finally {
    cargando.value = false;
  }
}

onMounted(async () => await cargar());

watch(filtro, async () => await cargar());
watch(rangoFechas, async () => {
  rangoFechas.value[0]?.setHours(0, 0);
  rangoFechas.value[1]?.setHours(23, 59);
  await cargar();
});
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <div class="text-xl mr-3">SOLICITUDES</div>
      <SelectButton v-model="filtro" :options="['No procesadas', 'Procesadas']" />
      <DatePicker v-model="rangoFechas" dateFormat="dd/mm/yy" show-icon selection-mode="range" />
    </div>

    <!-- Lista -->
    <DataView :value="solicitudes" data-key="id" paginator :rows="10" :rows-per-page-options="[10, 20, 50]" :loading="cargando">
      <template #list="{ items }">
        <div class="flex flex-col gap-2">
          <div
            v-for="(item, index) in (items as Solicitud[])"
            :key="item.id"
            :class="['p-3 rounded-lg border border-surface-200 dark:border-surface-700', index % 2 === 0 ? 'bg-surface-50 dark:bg-surface-800' : 'bg-white dark:bg-surface-900']"
          >
            <!-- Fila superior: fecha, estado, solicitante -->
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <span class="text-sm text-surface-500 dark:text-surface-400">
                {{ new Date(item.fechaCreacion).toLocaleString() }}
              </span>
              <span class="font-semibold text-surface-700 dark:text-surface-200">{{ item.solicitante }}</span>
              <span class="text-surface-500 dark:text-surface-400 text-sm ml-auto">{{ item.direccion }}</span>
            </div>

            <!-- Productos -->
            <div class="flex flex-col gap-1 mt-1">
              <div
                v-for="pc in item.productosCantidad"
                :key="pc.productoId"
                class="flex items-center gap-3 text-sm px-2 py-1 rounded bg-surface-100 dark:bg-surface-700"
              >
                <span class="font-medium truncate">{{ productosMap.get(pc.productoId)?.nombre ?? pc.productoId }}</span>
                <span class="text-surface-400 dark:text-surface-500 shrink-0">{{ productosMap.get(pc.productoId)?.codigo ?? '—' }}</span>
                <Tag :value="`${pc.cantidad} unidades`" severity="secondary" />
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #empty>
        <p class="text-center text-surface-400 py-6">No se encontraron solicitudes para el rango seleccionado.</p>
      </template>
    </DataView>
  </div>
</template>
