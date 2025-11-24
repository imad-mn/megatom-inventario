<script setup lang="ts">
import ListaEditable from '@/componentes/ListaEditable.vue';
</script>

<template>
  <div class="flex flex-wrap gap-4 md:justify-between items-start">
    <ListaEditable tipo="grupos" />
    <ListaEditable tipo="fabricantes" />
    <ListaEditable tipo="almacenistas" />
  </div>
</template>
