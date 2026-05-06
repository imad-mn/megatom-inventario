<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { ProductoConCantidad, Solicitud } from '@/servicios/modelos';
import { Coleccion, ObtenerConFiltroFecha } from '@/servicios/TablesDbService';
import { useGlobalStore } from '@/servicios/globalStore';
import { where } from 'firebase/firestore';
import DialogoVerProducto from '@/componentes/DialogoVerProducto.vue';

const globalStore = useGlobalStore();

const filtro = ref<'No procesadas' | 'Procesadas'>('No procesadas');
const rangoFechas = ref<(Date | null)[]>([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date(new Date().setHours(23, 59))
]);
const solicitudes = ref<Solicitud[]>([]);
const cargando = ref(false);
const productosMap = computed(() => new Map(globalStore.ObtenerProductosConCantidad().map(p => [p.id, p])));

const mostrarProducto = ref(false);
const productoDetalle = ref<ProductoConCantidad | null>(null);

const formatter = new Intl.DateTimeFormat('es-VE', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true
});

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


function VerProducto(productoId: string) {
  mostrarProducto.value = true;
  productoDetalle.value = productosMap.value.get(productoId) ?? null;
}
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <div class="text-xl mr-5">SOLICITUDES</div>
      <SelectButton v-model="filtro" :options="['No procesadas', 'Procesadas']" />
      <DatePicker v-model="rangoFechas" dateFormat="dd/mm/yy" show-icon selection-mode="range" />
    </div>

    <!-- Lista -->
    <DataView :value="solicitudes" data-key="id" paginator :rows="5" :rows-per-page-options="[5, 10, 20]" :loading="cargando">
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
                {{ item.fechaCreacion.toLocaleDateString() }} ({{ formatter.format(item.fechaCreacion) }})
              </span>
              <span class="font-semibold text-surface-700 dark:text-surface-200">{{ item.solicitante }}</span>
              <span class="text-surface-500 dark:text-surface-400 text-sm ml-auto">{{ item.direccion }}</span>
            </div>

            <!-- Productos -->
            <ul>
              <li v-for="pc in item.productosCantidad" :key="pc.productoId" class="text-sm list-disc ml-5 pt-1">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="font-medium">{{ productosMap.get(pc.productoId)?.nombre ?? pc.productoId }}</span>
                  <span class="text-surface-500 dark:text-surface-400">| Cód: {{ productosMap.get(pc.productoId)?.codigo ?? '—' }} |</span>
                  <span>Cantidad: {{ pc.cantidad }}</span>
                  <Button icon="pi pi-eye" severity="info" variant="text" size="small" rounded @click="VerProducto(pc.productoId)" />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
      <template #empty>
        <p class="text-center text-surface-400 py-6">No se encontraron solicitudes para el rango seleccionado.</p>
      </template>
    </DataView>
  </div>
  <DialogoVerProducto v-model:mostrar="mostrarProducto" :producto="productoDetalle" mostrarUbicacion />
</template>
