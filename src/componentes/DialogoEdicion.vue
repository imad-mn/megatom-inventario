<script setup lang="ts">
export interface Dialogo {
  encabezado: string,
  textoAceptar: string,
  iconoAceptar: string,
  clickAceptar(): void
}
interface DialogoEdicionProps {
  dialogo: Dialogo, 
  desabilitarAceptar: boolean,
}
defineProps<DialogoEdicionProps>();
const mostrar = defineModel<boolean>('mostrar')
</script>

<template>
  <Dialog v-model:visible="mostrar" :header="$props.dialogo.encabezado" :modal="true" class="w-11 md:w-6 lg:w-3">
    <slot></slot>
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <Button label="Cancelar" severity="secondary" rounded @click="mostrar = false" />
        <Button :icon="$props.dialogo.iconoAceptar" rounded :label="$props.dialogo.textoAceptar" 
          @click="$props.dialogo.clickAceptar" :disabled="$props.desabilitarAceptar" />
      </div>
    </template>
  </Dialog>
</template>