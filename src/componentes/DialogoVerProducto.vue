<script setup lang="ts">
import { useGlobalStore } from '@/servicios/globalStore';
import type { ProductoConCantidad } from '@/servicios/modelos';
import { computed } from 'vue';

const mostrar = defineModel<boolean>('mostrar')

interface DialogoVerProductoProps {
  producto: ProductoConCantidad | null
  mostrarUbicacion?: boolean
}
const props = defineProps<DialogoVerProductoProps>();

const globalStore = useGlobalStore();

const ubicaciones = computed(() => {
  if (props.mostrarUbicacion && props.producto) {
    const cantidades = globalStore.ObtenerCantidadesPorProducto(props.producto?.id);
    return globalStore.ObtenerUbicaciones(cantidades);
  }
  return [];
});
</script>

<template>
  <Dialog v-model:visible="mostrar" header="Detalles del Producto" modal class="w-full max-w-xl">
    <div v-if="props.producto" class="flex flex-wrap gap-5">
      <!-- Foto -->
      <div class="flex items-start justify-center w-full sm:w-auto">
        <img
          v-if="props.producto.imagenUrl"
          :src="props.producto.imagenUrl"
          :alt="props.producto.nombre"
          class="rounded-lg object-contain max-h-55 w-full sm:w-55"
        />
        <div v-else class="flex items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 w-full sm:w-48 h-48">
          <i class="pi pi-image text-4xl" />
        </div>
      </div>
      <!-- Atributos -->
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <div><span class="font-semibold">Nombre:&nbsp;</span>{{ props.producto.nombre ?? '—' }}</div>
        <div><span class="font-semibold">Código:&nbsp;</span>{{ props.producto.codigo ?? '—' }}</div>
        <div><span class="font-semibold">Fabricante:&nbsp;</span>{{ props.producto.fabricanteId ? globalStore.ListasMap[props.producto.fabricanteId] : '—' }}</div>
        <div><span class="font-semibold">Grupo:&nbsp;</span>{{ props.producto.grupoId ? globalStore.ListasMap[props.producto.grupoId] : '—' }}</div>
        <div><span class="font-semibold">Peso unitario:&nbsp;</span>{{ props.producto.pesoUnitario?.toFixed(2) }} kg</div>
        <div><span class="font-semibold">Estado:&nbsp;</span>{{ props.producto.estadoId ? globalStore.ListasMap[props.producto.estadoId]?.substring(3) : '—' }}</div>
        <div><span class="font-semibold">Cantidad:&nbsp;</span>{{ props.producto.cantidad }}</div>
      </div>
    </div>
    <div class="mt-1"><span class="font-semibold">Descripción:&nbsp;</span>{{ props.producto?.descripcion ?? '—' }}</div>

    <div v-if="props.mostrarUbicacion" class="mt-2">
      <div><b>Ubicación:</b></div>
      <ul class="list-disc list-inside">
        <li v-for="(ubic, index) in ubicaciones" :key="index">{{ ubic }}</li>
      </ul>
    </div>
  </Dialog>
</template>
