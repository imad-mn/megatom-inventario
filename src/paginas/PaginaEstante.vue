<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="flex  justify-between items-center mb-3">
    <Button label="Galpón" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push(`/galpon/${$route.params.galpon}`)" />
    <div class="text-xl">ESTANTE {{$route.params.estante}}</div>
    <Button label="Sección" icon="pi pi-plus" severity="info" variant="outlined" />
  </div>
</template>
