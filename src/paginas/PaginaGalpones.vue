<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Galpon } from '@/servicios/modelos.ts';
import { ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import { Button } from 'primevue';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { useAuthStore } from '@/servicios/authStore';
import { useGlobalStore } from '@/servicios/globalStore';
import { RegistrarHistorial } from '@/servicios/historialService';

const authStore = useAuthStore();
const { Usuario } = authStore;

const confirm = useConfirm();
const router = useRouter();

const dialogVisible = ref(false);
const itemEdicion = ref<Galpon>({ id: '', nombre: '', descripcion: '', ordenDescendente: false, estantes: [] });
const esNuevo = ref(false);

const globalStore = useGlobalStore();

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { id: '', nombre: '', descripcion: '', ordenDescendente: false, estantes: [] };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear(TablesDbService.Coleccion.Galpones, itemEdicion.value);
    await RegistrarHistorial(itemEdicion.value.id, '[Galpón] Creado', null, `${itemEdicion.value.nombre}-${itemEdicion.value.descripcion}`);
    globalStore.Galpones.push({ ...itemEdicion.value });
  } else {
    const indice = globalStore.Galpones.findIndex(x => x.id === itemEdicion.value.id);
    if (indice >= 0) {
      await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, itemEdicion.value);
      await RegistrarHistorial(itemEdicion.value.id, '[Galpón] Modificado', `${globalStore.Galpones[indice]?.nombre}-${globalStore.Galpones[indice]?.descripcion}`, `${itemEdicion.value.nombre}-${itemEdicion.value.descripcion}`);
      globalStore.Galpones[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Galpon) {
  globalStore.GalponSeleccionado = item;
  router.push('/galpon');
}

function Editar(item: Galpon) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Galpon): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Galpón: "${item.nombre}" y sus descendientes?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      await RegistrarHistorial(item.id, '[Galpón] Eliminado', `${item.nombre}-${item.descripcion}`, null);
      const indice = globalStore.Galpones.findIndex(x => x.id === item.id);
      await TablesDbService.Eliminar(TablesDbService.Coleccion.Galpones, item);
      if (indice >= 0) globalStore.Galpones.splice(indice, 1);
    }
  });
}

function ImprimirGalpon(item: Galpon) {
  globalStore.GalponSeleccionado = item;
  router.push('/imprimir/galpon');
}
</script>

<template>
  <div class="grid grid-cols-3 items-center mb-10">
    <div class="col-start-2 justify-self-center text-xl">GALPONES</div>
    <Button class="justify-self-end" v-show="Usuario" severity="info" variant="outlined" @click="Agregar" v-tooltip.bottom="'Agregar Galpón'">
      <span class="p-button-icon p-button-icon-left pi pi-plus" />
      <span class="p-button-label hidden md:inline">Galpón</span>
    </Button>
  </div>

  <div v-if="globalStore.Galpones.length === 0" class="italic text-muted-color mt-3">No hay Galpones</div>
  <div class="flex flex-wrap gap-10 justify-center">
    <div v-for="item in globalStore.Galpones.sort((a, b) => a.nombre.localeCompare(b.nombre))" :key="item.id"
      class="flex justify-center border-1 rounded-md border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 p-0 md:p-2 w-39">
      <Button variant="text" @click="Ver(item)" v-tooltip.bottom="'Ver Galpón'">
        <div>
          <i class="pi pi-warehouse text-6xl mb-4"></i>
          <div class="text-muted-color font-semibold">{{ 'Galpón ' + item.nombre }}</div>
          <div class="text-muted-color text-wrap">{{ item.descripcion }}</div>
        </div>
      </Button>
      <EditarQuitar @editar-click="Editar(item)" @quitar-click="Quitar(item)" :boton-imprimir="true" @imprimir-click="ImprimirGalpon(item)" :vertical="true" :id-elemento="item.id" :nombre-elemento="'Galpón ' + item.nombre" />
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Galpón"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full mt-1">
        <label for="nombre">Galpón</label>
        <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" aria-autocomplete="none"  @keyup.enter="Guardar" />
      </FloatLabel>
      <FloatLabel variant="on" class="w-full mt-1">
        <label for="descripcion">Descripción</label>
        <InputText id="descripcion" v-model="itemEdicion.descripcion" class="w-full" :invalid="!itemEdicion?.descripcion" aria-autocomplete="none"  @keyup.enter="Guardar" />
      </FloatLabel>
      <div class="flex gap-2 items-center">
        <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
        <label for="ordenDescendente">Orden Descendente</label>
      </div>
    </div>
  </DialogoEdicion>
</template>
