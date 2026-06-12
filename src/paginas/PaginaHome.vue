<script setup lang="ts">
import { useGlobalStore } from "@/servicios/globalStore";

const globalStore = useGlobalStore();
</script>

<template>
  <div class="h-[calc(100vh-6rem)] flex items-center justify-center overflow-hidden">
    <img
      :src="globalStore.esTomasCapasso ? '/TomasCapasso.png' : '/Megatom-Home.png'"
      alt="Logo"
      class="max-h-full max-w-full object-contain"
    />
  </div>
</template>
