<script setup lang="ts">
import ListaEditable from '@/componentes/ListaEditable.vue';
</script>

<template>
  <div class="text-xl text-center mb-5">LISTAS DE CONFIGURACIÓN</div>
  <div class="flex flex-wrap gap-4 md:justify-between items-start">
    <ListaEditable tipo="grupos" />
    <ListaEditable tipo="fabricantes" />
    <ListaEditable tipo="almacenistas" />
  </div>
</template>
