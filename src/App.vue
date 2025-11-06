<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';

const router = useRouter();
const route = useRoute();

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
    label: 'Listas',
    icon: PrimeIcons.LIST,
    command: () => router.push('/listas')
  },
  {
    label: 'Usuarios',
    icon: PrimeIcons.USERS,
    command: () => router.push('/usuarios')
  },
]);

</script>

<template>
  <Menubar :model="menuItems" class="mb-3!">
    <template #end>
      <div class="md:hidden text-lg">{{ route.name }}</div>
    </template>
  </Menubar>
  <RouterView />
  <ConfirmDialog />
</template>
