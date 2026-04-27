<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import BarraMenu from './componentes/BarraMenu.vue';
import DialogoHistorial from './componentes/DialogoHistorial.vue';
import { useGlobalStore } from './servicios/globalStore';

const globalStore = useGlobalStore();
const cargando = ref(false);
const mostrarBotonArriba = ref(false);

const { dialogoHistorial, CargarTodo } = globalStore;

onMounted(async () => {
  cargando.value = true;
  await CargarTodo();
  cargando.value = false;
  window.addEventListener('scroll', manejarScroll);
})

onUnmounted(() => {
  window.removeEventListener('scroll', manejarScroll);
})

function manejarScroll() {
  mostrarBotonArriba.value = window.scrollY > 100;
}

function IrArriba() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <BarraMenu />
  <RouterView />
  <ConfirmDialog />
  <DialogoHistorial v-model:mostrar="dialogoHistorial.mostrar" :id="dialogoHistorial.idElemento" :nombre="dialogoHistorial.nombreElemento" />
  <div v-if="mostrarBotonArriba" class="flex justify-center noprint">
    <Button label="Ir Arriba" class="fixed bottom-2" icon="pi pi-arrow-up" severity="secondary" @click="IrArriba" />
  </div>
  <div v-if="cargando" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <ProgressSpinner />
  </div>
</template>
