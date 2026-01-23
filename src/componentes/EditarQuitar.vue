<script setup lang="ts">
interface EditarGuardarProps {
  tamaño?: 'small' | 'large';
  vertical?: boolean;
  onEditarClick(): void,
  onQuitarClick(): void,
}
const props = defineProps<EditarGuardarProps>();
</script>

<template>
  <div :class="`flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-center`">
    <Button icon="pi pi-pen-to-square" severity="success" variant="text" :size="props.tamaño" v-tooltip.bottom="'Editar'" @click="onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="text" :size="props.tamaño" v-tooltip.bottom="'Quitar'" @click="onQuitarClick" />
  </div>
</template>
