<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import type { ProductoConCantidad, Solicitud } from '@/servicios/modelos';
import { Actualizar, Coleccion, Eliminar, ObtenerConFiltroFecha } from '@/servicios/TablesDbService';
import { useGlobalStore } from '@/servicios/globalStore';
import { where } from 'firebase/firestore';
import DialogoVerProducto from '@/componentes/DialogoVerProducto.vue';
import { useConfirm } from 'primevue';
import { useRouter } from 'vue-router';

const globalStore = useGlobalStore();
const confirm = useConfirm();
const router = useRouter();

const filtro = ref<'No procesadas' | 'Procesadas'>('No procesadas');
const rangoFechas = ref<(Date | null)[]>([
  new Date(new Date().setDate(new Date().getDate() - 30)),
  new Date(new Date().setHours(23, 59))
]);
const solicitudes = ref<Solicitud[]>([]);
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
  const procesada = filtro.value === 'Procesadas';

  solicitudes.value = await ObtenerConFiltroFecha<Solicitud>(
    Coleccion.Solicitudes,
    rangoFechas.value[0],
    rangoFechas.value[1],
    [where('procesada', '==', procesada)]
  );
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
function Procesar(solicitud: Solicitud) {
  confirm.require({
    header: 'Procesar Solicitud',
    message: `¿Quieres procesar la solicitud de: "${solicitud.solicitante}"?`,
    acceptClass: 'p-button-success p-button-outlined',
    acceptIcon: 'pi pi-check-circle',
    rejectClass: 'p-button-secondary p-button-outlined',
    accept: async () => {
      solicitud.procesada = true;
      await Actualizar(Coleccion.Solicitudes, solicitud);
      const idx = solicitudes.value.findIndex(s => s.id === solicitud.id);
      if (idx !== -1) solicitudes.value.splice(idx, 1);
    }
  });
}
function EliminarSolicitud(solicitud: Solicitud) {
  confirm.require({
    header: 'Eliminar Solicitud',
    message: `¿Quieres eliminar la solicitud de: "${solicitud.solicitante}"?`,
    acceptClass: 'p-button-danger p-button-outlined',
    acceptIcon: 'pi pi-trash',
    rejectClass: 'p-button-secondary p-button-outlined',
    accept: async () => {
      await Eliminar(Coleccion.Solicitudes, solicitud);
      const idx = solicitudes.value.findIndex(s => s.id === solicitud.id);
      if (idx !== -1) solicitudes.value.splice(idx, 1);
    }
  });
}
function ImprimirSolicitud(solicitud: Solicitud) {
  globalStore.solicitudActual = solicitud;
  router.push('/imprimir/solicitud');
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <div class="text-xl mr-5">SOLICITUDES</div>
      <SelectButton v-model="filtro" :options="['No procesadas', 'Procesadas']" />
      <DatePicker v-model="rangoFechas" dateFormat="dd/mm/yy" show-icon selection-mode="range" />
    </div>

    <!-- Lista -->
    <DataView :value="solicitudes" data-key="id">
      <template #list="{ items }">
        <div class="flex flex-col gap-2">
          <div
            v-for="(item, index) in (items as Solicitud[])"
            :key="item.id"
            :class="['p-3 rounded-lg border border-surface-200 dark:border-surface-700', index % 2 === 0 ? 'bg-surface-50 dark:bg-surface-800' : 'bg-white dark:bg-surface-900']"
          >
            <!-- Fila superior: fecha, solicitante -->
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap gap-2">
                <span class="text-sm text-surface-500 dark:text-surface-400">
                  {{ item.fechaCreacion.toLocaleDateString() }} ({{ formatter.format(item.fechaCreacion) }})
                </span>
                <span class="font-semibold text-surface-700 dark:text-surface-200">{{ item.solicitante }}</span>
              </div>
              <div class="flex gap-1">
                <Button icon="pi pi-print" severity="contrast" variant="text" size="small" v-tooltip.bottom="'Imprimir solicitud'" @click="ImprimirSolicitud(item)" />
                <Button v-if="!item.procesada" icon="pi pi-check-circle" severity="success" variant="text" size="small" v-tooltip.bottom="'Procesar solicitud'" @click="Procesar(item)" />
                <Button v-if="!item.procesada" icon="pi pi-trash" severity="danger" variant="text" size="small" v-tooltip.bottom="'Eliminar solicitud'" @click="EliminarSolicitud(item)" />
              </div>
            </div>
            <div class="text-sm">Telf. {{ item.telefono}}  |  Dirección: {{ item.direccion }}</div>

            <!-- Productos -->
            <ul class="mt-3">
              <li v-for="pc in item.productosCantidad" :key="pc.productoId" class="text-sm list-disc ml-5">
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
