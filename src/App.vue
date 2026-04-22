<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { MenuItem } from 'primevue/menuitem';
import { PrimeIcons } from '@primevue/core/api';
import DialogoHistorial from './componentes/DialogoHistorial.vue';
import { useGlobalStore } from './servicios/globalStore';
import { useAuthStore } from './servicios/authStore';

const router = useRouter();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const cargando = ref(false);

const { dialogoHistorial, CargarTodo } = globalStore;

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
  menuItems.value.filter(item => !(item as MenuItem & { isAdmin?: boolean }).isAdmin || authStore.Usuario)
);

onMounted(async () => {
  cargando.value = true;
  await CargarTodo();
  cargando.value = false;
})

async function cerrarSesion() {
  await authStore.logOut();
  router.push('/');
}
</script>

<template>
  <Menubar :model="menuItemsVisibles" class="mb-3! noprint" breakpoint="768px">
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
      <Button
        v-if="!authStore.Usuario"
        label="Admin"
        icon="pi pi-key"
        variant="text"
        severity="secondary"
        @click="router.push('/login')"
      />
    </template>
  </Menubar>
  <RouterView />
  <ConfirmDialog />
  <DialogoHistorial v-model:mostrar="dialogoHistorial.mostrar" :id="dialogoHistorial.idElemento" :nombre="dialogoHistorial.nombreElemento" />

  <div v-if="cargando" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <ProgressSpinner />
  </div>
</template>
