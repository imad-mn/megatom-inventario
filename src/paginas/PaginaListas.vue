<script setup lang="ts">
import ListaEditable from '@/componentes/ListaEditable.vue';
</script>

<template>
  <div class="text-xl text-center mb-5">LISTAS DE CONFIGURACIÓN</div>
  <div class="flex flex-wrap gap-4 justify-between items-start mb-2">
    <ListaEditable tipo="grupos" />
    <ListaEditable tipo="fabricantes" />
    <div class="flex flex-col gap-4 w-full md:w-auto">
      <ListaEditable tipo="almacenistas" />
      <ListaEditable tipo="estados" />
    </div>
  </div>
</template>
