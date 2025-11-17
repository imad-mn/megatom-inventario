<script setup lang="ts">
interface DialogoEdicionProps {
  esAgregar: boolean,
  clickAceptar(): void
  desabilitarAceptar: boolean,
}
defineProps<DialogoEdicionProps>();
const mostrar = defineModel<boolean>('mostrar')
</script>

<template>
  <Dialog v-model:visible="mostrar" :header="$props.esAgregar ? 'Agregar' : 'Editar'" :modal="true" class="w-xs md:w-sm">
    <slot></slot>
    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" @click="mostrar = false" severity="secondary" variant="outlined" />
      <Button label="Guardar" icon="pi pi-save" @click="$props.clickAceptar" :disabled="$props.desabilitarAceptar" variant="outlined" />
    </template>
  </Dialog>
</template>
