<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';
import {  ObtenerTodos } from './servicios/TablesDbService';
import DialogoHistorial from './componentes/DialogoHistorial.vue';
import { dialogoHistorial, Inventarios, Listas, Usuario } from './servicios/shared';
import { auth } from './servicios/firebase';

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
    label: 'HISTORIAL',
    icon: PrimeIcons.HISTORY,
    isAdmin: true,
    command: () => router.push('/historial')
  },
  {
    label: 'DATA',
    icon: PrimeIcons.LIST,
    isAdmin: true,
    command: () => router.push('/listas')
  },
]);

const menuItemsVisibles = computed(() =>
  menuItems.value.filter(item => !(item as MenuItem & { isAdmin?: boolean }).isAdmin || Usuario.value)
);

onMounted(async () => {
  Inventarios.value = await ObtenerTodos('inventario');
  Listas.value = await ObtenerTodos('listas');
})

async function cerrarSesion() {
  await auth.signOut();
  Usuario.value = undefined;
  router.push('/');
}
</script>

<template>
  <Menubar :model="menuItemsVisibles" class="mb-3!" breakpoint="768px">
    <template #start>
      <RouterLink to="/">
        <div class="flex items-center">
          <img src="/Megatom-Icono.png" alt="Megatom Logo" class="h-8" />
          <div class="text-md megatom-color hidden md:block mr-5 ml-2">INVENTARIO</div>
        </div>
      </RouterLink>
    </template>
    <template #end>
      <div v-if="Usuario">
        <span><i class="pi pi-user" />&nbsp;{{ Usuario.user.displayName }}</span>
        <Button
          icon="pi pi-sign-out"
          variant="text"
          @click="cerrarSesion"
          v-tooltip.bottom="'Cerrar sesión'"
        />
      </div>
      <Button
        v-if="!Usuario"
        label="Admin"
        icon="pi pi-key"
        variant="text"
        @click="router.push('/login')"
      />
    </template>
  </Menubar>
  <RouterView />
  <ConfirmDialog />
  <DialogoHistorial v-model:mostrar="dialogoHistorial.mostrar" :id="dialogoHistorial.idElemento" :nombre="dialogoHistorial.nombreElemento" />
</template>
