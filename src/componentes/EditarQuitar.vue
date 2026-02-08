<script setup lang="ts">
interface EditarQuitarProps {
  tamaño?: 'small' | 'large';
  vertical?: boolean;
  onEditarClick: () => void;
  onQuitarClick: () => void;
}
const props = defineProps<EditarQuitarProps>();
</script>

<template>
  <div :class="`flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-center`">
    <Button icon="pi pi-pen-to-square" severity="success" variant="text" :size="props.tamaño" v-tooltip.bottom="'Editar'" @click="props.onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="text" :size="props.tamaño" v-tooltip.bottom="'Quitar'" @click="props.onQuitarClick" />
  </div>
</template>
