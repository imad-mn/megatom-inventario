<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';
import { useAuthStore } from '@/servicios/authStore';
import { useGlobalStore } from '@/servicios/globalStore';

const router = useRouter();
const authStore = useAuthStore();
const globalStore = useGlobalStore();

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
    label: 'SOLICITUDES',
    icon: PrimeIcons.INBOX,
    isAdmin: true,
    command: () => router.push('/solicitudes')
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
  menuItems.value.filter(item => !(item as MenuItem & { isAdmin?: boolean }).isAdmin || authStore.Usuario)
);

async function cerrarSesion() {
  await authStore.logOut();
  router.push('/');
}
</script>

<template>
    <Menubar :model="menuItemsVisibles" class="noprint mb-3!" breakpoint="768px">
    <template #start>
      <RouterLink to="/">
        <div class="flex items-center">
          <img src="/Megatom-Icono.png" alt="Megatom Logo" class="h-8" />
          <div class="text-md hidden md:block mr-5 ml-2">INVENTARIO</div>
        </div>
      </RouterLink>
    </template>
    <template #end>
      <div v-if="authStore.Usuario">
        <span><i class="pi pi-user" />&nbsp;{{ authStore.Usuario.user.displayName }}</span>
        <Button
          icon="pi pi-sign-out"
          variant="text"
          @click="cerrarSesion"
          severity="secondary"
          v-tooltip.bottom="'Cerrar sesión'"
        />
      </div>
      <div v-else>
        <Button icon="pi pi-inbox" severity="secondary" variant="text" badge-severity="danger" v-tooltip.bottom="'Ver Solicitud'" @click="router.push('/solicitud')"
          :badge="globalStore.solicitudActual.productosCantidad.length > 0 ? globalStore.solicitudActual.productosCantidad.length.toString() : undefined" />
        <Button
          label="Admin"
          icon="pi pi-key"
          variant="text"
          severity="secondary"
          @click="router.push('/login')"
        />
      </div>
    </template>
  </Menubar>
</template>
