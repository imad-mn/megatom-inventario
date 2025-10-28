<script setup lang="ts">
interface EditarGuardarProps {
  onEditarClick(): void,
  onQuitarClick(): void,
}
defineProps<EditarGuardarProps>();
</script>

<template>
  <div class="flex gap-1">
    <Button icon="pi pi-pen-to-square" severity="success" variant="outlined" size="small" @click="onEditarClick" />
    <Button icon="pi pi-trash" severity="danger" variant="outlined" size="small" @click="onQuitarClick" />
  </div>
</template>
