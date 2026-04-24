<script setup lang="ts">
import { useGlobalStore } from '@/servicios/globalStore';
import { useAuthStore } from '@/servicios/authStore';

const globalStore = useGlobalStore();
const { dialogoHistorial } = globalStore;
const usuario = useAuthStore().Usuario;

interface EditarQuitarProps {
  tamaño?: 'small' | 'large';
  vertical?: boolean;
  onEditarClick: () => void;
  onQuitarClick: () => void;
  onImprimirClick?: () => void;
  botonImprimir?: boolean;
  idElemento: string;
  nombreElemento: string;
}
const props = defineProps<EditarQuitarProps>();

function onHistorialClick() {
  dialogoHistorial.mostrar = true;
  dialogoHistorial.idElemento = props.idElemento;
  dialogoHistorial.nombreElemento = props.nombreElemento;
}
</script>

<template>
  <div v-if="usuario" :class="`flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-center`">
    <Button icon="pi pi-history" severity="info" variant="text" :size="props.tamaño" v-tooltip.bottom="'Historial'" @click="onHistorialClick" />
    <Button icon="pi pi-pen-to-square" severity="success" variant="text" :size="props.tamaño" v-tooltip.bottom="'Editar'" @click="props.onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="text" :size="props.tamaño" v-tooltip.bottom="'Quitar'" @click="props.onQuitarClick" />
    <Button v-if="props.botonImprimir" icon="pi pi-print" severity="secondary" variant="text" :size="props.tamaño" v-tooltip.bottom="'Imprimir'" @click="props.onImprimirClick" />
  </div>
</template>
