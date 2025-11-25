<script setup lang="ts">
interface EditarGuardarProps {
  tamaño?: 'small' | 'large';
  onEditarClick(): void,
  onQuitarClick(): void,
}
const props = defineProps<EditarGuardarProps>();
</script>

<template>
  <div class="flex gap-1">
    <Button icon="pi pi-pen-to-square" severity="success" variant="text" :size="props.tamaño" @click="onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="text" :size="props.tamaño" @click="onQuitarClick" />
  </div>
</template>
