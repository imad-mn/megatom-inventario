<script setup lang="ts">
interface DialogoEdicionProps {
  esAgregar?: boolean,
  clickAceptar: () => Promise<void>,
  desabilitarAceptar: boolean,
  nombreObjeto?: string,
  class?: string,
  encabezado?: string,
}
const props = defineProps<DialogoEdicionProps>();
const mostrar = defineModel<boolean>('mostrar')
</script>

<template>
  <Dialog v-model:visible="mostrar" :header="$props.encabezado ?? ($props.esAgregar ? 'Agregar ' : 'Editar ') + $props.nombreObjeto" :modal="true" :class="props.class ?? 'w-xs md:w-sm'">
    <slot></slot>
    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" @click="mostrar = false" severity="secondary" variant="outlined" />
      <Button label="Guardar" icon="pi pi-save" @click="async () => await props.clickAceptar()" :disabled="props.desabilitarAceptar" variant="outlined" />
    </template>
  </Dialog>
</template>
