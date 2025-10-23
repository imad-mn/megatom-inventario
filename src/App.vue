<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';

const router = useRouter();

const menuItems = ref<MenuItem[]>([
  {
    label: 'Inventario',
    icon: PrimeIcons.WAREHOUSE,
    command: () => router.push('/inventario')
  },
  {
    label: 'Productos',
    icon: PrimeIcons.HAMMER,
    command: () => router.push('/productos')
  },
  {
    label: 'Configuración',
    icon: PrimeIcons.COG,
    command: () => router.push('/configuracion')
  },
]);

</script>

<template>
  <Menubar :model="menuItems" class="mb-2" />
  <RouterView />
</template>
