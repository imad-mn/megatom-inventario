<script setup lang="ts">
import { dialogoHistorial } from '@/servicios/TablesDbService';

interface EditarQuitarProps {
  tamaño?: 'small' | 'large';
  vertical?: boolean;
  onEditarClick: () => void;
  onQuitarClick: () => void;
  idElemento: string;
  nombreElemento: string;
}
const props = defineProps<EditarQuitarProps>();

function onHistorialClick() {
  dialogoHistorial.value.mostrar = true;
  dialogoHistorial.value.idElemento = props.idElemento;
  dialogoHistorial.value.nombreElemento = props.nombreElemento;
}
</script>

<template>
  <div :class="`flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-center`">
    <Button icon="pi pi-history" severity="info" variant="text" :size="props.tamaño" v-tooltip.bottom="'Historial'" @click="onHistorialClick" />
    <Button icon="pi pi-pen-to-square" severity="success" variant="text" :size="props.tamaño" v-tooltip.bottom="'Editar'" @click="props.onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="text" :size="props.tamaño" v-tooltip.bottom="'Quitar'" @click="props.onQuitarClick" />
  </div>
</template>
