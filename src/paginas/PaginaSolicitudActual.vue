<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGlobalStore } from '@/servicios/globalStore';
import { Coleccion, CrearConFecha } from '@/servicios/TablesDbService';
import { useConfirm } from 'primevue/useconfirm';
import DialogoVerProducto from '@/componentes/DialogoVerProducto.vue';

const globalStore = useGlobalStore();
const solicitud = globalStore.solicitudActual;
const confirm = useConfirm();

const enviando = ref(false);
const enviada = ref(false);
const productoVer = ref<string>();
const mostrarProducto = ref(false);

const productosMap = computed(() => new Map(globalStore.ObtenerProductosConCantidad().map(p => [p.id, p])));
const productoDetalle = computed(() => productoVer.value ? productosMap.value.get(productoVer.value) ?? null : null);

const totalUnidades = computed(() =>
  solicitud.productosCantidad.reduce((acc, p) => acc + p.cantidad, 0)
);

const formularioValido = computed(() =>
  solicitud.solicitante.trim().length > 0 &&
  solicitud.telefono.trim().length > 0 &&
  solicitud.direccion.trim().length > 0 &&
  solicitud.productosCantidad.length > 0 &&
  solicitud.productosCantidad.every(p => p.cantidad > 0)
);

function VerProducto(productoId: string) {
  productoVer.value = productoId;
  mostrarProducto.value = true;
}

function EliminarProducto(productoId: string) {
  const nombre = productosMap.value.get(productoId)?.nombre ?? productoId;
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar: "${nombre}"?`,
    acceptClass: 'p-button-danger p-button-outlined',
    acceptIcon: 'pi pi-trash',
    rejectClass: 'p-button-secondary p-button-outlined',
    accept: () => {
      const idx = solicitud.productosCantidad.findIndex(p => p.productoId === productoId);
      if (idx !== -1) solicitud.productosCantidad.splice(idx, 1);
    }
  });
}

async function EnviarSolicitud() {
  if (!formularioValido.value || enviando.value) return;

  enviando.value = true;
  try {
    solicitud.fechaCreacion = new Date();
    solicitud.procesada = false;
    await CrearConFecha(Coleccion.Solicitudes, { ...solicitud });
    enviada.value = true;
    globalStore.solicitudActual = { id: '', fechaCreacion: new Date(), solicitante: '', direccion: '', telefono: '', procesada: false, productosCantidad: [] }
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <div class="max-w-xl mx-auto">
    <div class="text-2xl text-center font-semibold mb-4">SOLICITUD DE PRODUCTOS</div>

    <!-- Mensaje de éxito -->
    <Message v-if="enviada" severity="success" class="mb-4">Solicitud enviada exitosamente</Message>

    <!-- Datos del solicitante -->
    <div class="flex flex-col gap-4 mb-6">
      <FloatLabel variant="on">
        <InputText
          id="solicitante"
          v-model="solicitud.solicitante"
          class="w-full"
          :disabled="enviada"
          :invalid="!enviada && solicitud.solicitante.trim().length === 0"
        />
        <label for="solicitante">Solicitante (Nombre Completo)</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputMask
          id="telefono"
          v-model="solicitud.telefono"
          mask="(9999) 999-9999"
          class="w-full"
          :disabled="enviada"
          :invalid="!enviada && solicitud.telefono.trim().length === 0"
        />
        <label for="telefono">Teléfono</label>
      </FloatLabel>

      <FloatLabel variant="on">
        <InputText
          id="direccion"
          v-model="solicitud.direccion"
          class="w-full"
          :disabled="enviada"
          :invalid="!enviada && solicitud.direccion.trim().length === 0"
        />
        <label for="direccion">Dirección a la que se enviará</label>
      </FloatLabel>
    </div>

    <!-- Lista de productos (carrito) -->
    <div class="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden mb-4">
      <div class="bg-surface-100 dark:bg-surface-800 px-4 py-2 font-semibold text-surface-600 dark:text-surface-300">Productos</div>

      <div v-if="solicitud.productosCantidad.length === 0" class="py-10 text-center text-surface-400 dark:text-surface-500">
        No hay productos en la solicitud.
      </div>

      <div
        v-for="(item, index) in solicitud.productosCantidad"
        :key="item.productoId"
        :class="['p-3 border-t border-surface-100 dark:border-surface-700', index % 2 === 0 ? 'bg-white dark:bg-surface-900' : 'bg-surface-50 dark:bg-surface-800']"
      >
        <!-- Nombre del producto -->
        <div class="font-medium mb-2">{{ productosMap.get(item.productoId)?.nombre ?? '—' }}</div>

        <div class="flex items-center">
          <!-- Codigo del producto -->
          <div class="flex-1 text-sm text-surface-500 dark:text-surface-400">Código: {{ productosMap.get(item.productoId)?.codigo ?? '' }}</div>

          <!-- Cantidad editable -->
          <InputNumber
            v-model="item.cantidad"
            :min="1"
            showButtons
            buttonLayout="horizontal"
            :disabled="enviada"
            :max="productosMap.get(item.productoId)?.cantidad ?? 0"
            inputClass="text-center w-12"
            incrementIcon="pi pi-plus"
            decrementIcon="pi pi-minus"
          />

          <!-- Botón Ver -->
          <Button
            icon="pi pi-eye"
            severity="info"
            variant="outlined"
            class="ml-6 mr-2"
            @click="VerProducto(item.productoId)"
          />
          <!-- Botón eliminar -->
          <Button
            icon="pi pi-trash"
            severity="danger"
            variant="outlined"
            :disabled="enviada"
            @click="EliminarProducto(item.productoId)"
          />
        </div>
      </div>

      <!-- Totales -->
      <div v-if="solicitud.productosCantidad.length > 0" class="px-4 py-3 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 flex justify-end gap-6 text-sm">
        <span class="text-surface-500 dark:text-surface-400">Total productos: <b class="text-surface-700 dark:text-surface-200">{{ solicitud.productosCantidad.length }}</b></span>
        <span class="text-surface-500 dark:text-surface-400">Total unidades: <b class="text-surface-700 dark:text-surface-200">{{ totalUnidades }}</b></span>
      </div>
    </div>

    <!-- Botón enviar -->
    <div class="flex justify-end mb-4">
      <Button
        label="Enviar Solicitud"
        icon="pi pi-send"
        :disabled="!formularioValido || enviada || enviando"
        :loading="enviando"
        variant="outlined"
        @click="EnviarSolicitud"
      />
    </div>
  </div>

  <DialogoVerProducto v-model:mostrar="mostrarProducto" :producto="productoDetalle" />
</template>
