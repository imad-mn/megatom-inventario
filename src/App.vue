<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';
import { Inventarios, Listas, ObtenerTodos } from './servicios/TablesDbService';
import { account, Usuario } from './servicios/appwrite';

const router = useRouter();

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
    isAdmin: true,
    command: () => router.push('/listas')
  },
]);

onMounted(async () => {
  Inventarios.value = await ObtenerTodos('inventario');
  Listas.value = await ObtenerTodos('listas');
})

async function cerrarSesion() {
  await account.deleteSession({ sessionId: 'current' });
  Usuario.value = undefined;
  router.push('/');
}
</script>

<template>
  <Menubar :model="menuItems.filter(item => item.isAdmin ? Usuario : true)" class="mb-3!" breakpoint="768px">
    <template #start>
      <RouterLink to="/">
        <div class="flex items-center">
          <img src="/48.png" alt="Megatom Logo" class="h-8 mr-2" />
          <div class="text-lg">Megatom Inventario</div>
        </div>
      </RouterLink>
    </template>
    <template #end>
      <div v-if="Usuario">
        <span><i class="pi pi-user" />&nbsp;{{ Usuario.name }}</span>
        <Button
          label="Cerrar Sesión"
          icon="pi pi-sign-out"
          variant="text"
          severity="secondary"
          @click="cerrarSesion"
        />
      </div>
      <Button
        v-if="!Usuario"
        label="Administrador"
        icon="pi pi-key"
        variant="text"
        severity="secondary"
        @click="router.push('/login')"
      />
    </template>
  </Menubar>
  <RouterView />
  <ConfirmDialog />
</template>
