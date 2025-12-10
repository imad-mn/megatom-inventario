<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';

const router = useRouter();
const route = useRoute();

const menuItems = ref<MenuItem[]>([
  {
    label: 'GALPONES',
    icon: PrimeIcons.WAREHOUSE,
    command: () => router.push('/galpones')
  },
  {
    label: 'PRODUCTOS',
    icon: PrimeIcons.HAMMER,
    command: () => router.push('/productos')
  },
  {
    label: 'MOVIMIENTOS',
    icon: PrimeIcons.ARROW_RIGHT_ARROW_LEFT,
    command: () => router.push('/movimientos')
  },
  {
    label: 'DATA',
    icon: PrimeIcons.LIST,
    command: () => router.push('/listas')
  },
  {
    label: 'USUARIOS',
    icon: PrimeIcons.USERS,
    command: () => router.push('/usuarios')
  },
]);

</script>

<template>
  <Menubar :model="menuItems" class="mb-3!" breakpoint="768px">
    <template #end>
      <div class="md:hidden text-lg">{{ route.name }}</div>
    </template>
  </Menubar>
  <RouterView />
  <ConfirmDialog />
</template>
