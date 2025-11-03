<script setup lang="ts">
interface EditarGuardarProps {
  onEditarClick(): void,
  onQuitarClick(): void,
}
defineProps<EditarGuardarProps>();
</script>

<template>
  <div class="flex gap-1">
    <Button icon="pi pi-pen-to-square" severity="success" variant="text" size="small" @click="onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="text" size="small" @click="onQuitarClick" />
  </div>
</template>
