<script setup lang="ts">
import ListaEditable from '@/componentes/ListaEditable.vue';
</script>

<template>
  <div class="flex flex-wrap gap-4 md:justify-between items-start">
    <ListaEditable nombreTabla="Grupos" />
    <ListaEditable nombreTabla="Fabricantes" />
    <ListaEditable nombreTabla="Almacenistas" />
  </div>
</template>
