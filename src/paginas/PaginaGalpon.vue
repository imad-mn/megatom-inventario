<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Estante, ItemOrdenable } from '@/servicios/modelos.ts';
import { computed, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { EstanteSeleccionado, GalponSeleccionado, Usuario } from '@/servicios/shared';

const confirm = useConfirm();
const router = useRouter();

const estantes = computed(() =>
  [...GalponSeleccionado.value!.estantes].sort((a, b) =>
    GalponSeleccionado.value!.ordenDescendente
      ? b.nombre.localeCompare(a.nombre)
      : a.nombre.localeCompare(b.nombre)
  )
);

const dialogVisible = ref(false);
const itemEdicion = ref<ItemOrdenable>({ id: '', nombre: '', ordenDescendente: false });
const esNuevo = ref(false);
const esEditandoGalpon = ref(false);

function Agregar() {
  esNuevo.value = true;
  esEditandoGalpon.value = false;
  itemEdicion.value = { id: crypto.randomUUID(), nombre: '', ordenDescendente: false };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    const nuevoEstante: Estante = { ...itemEdicion.value, niveles: [] };
    GalponSeleccionado.value!.estantes.push(nuevoEstante);
    await TablesDbService.Actualizar('galpones', GalponSeleccionado.value!);
    await TablesDbService.RegistrarHistorial(itemEdicion.value.id, '[Estante] Creado', null, itemEdicion.value.nombre);
  } else if (esEditandoGalpon.value) {
    const nombreAnterior = GalponSeleccionado.value!.nombre;
    GalponSeleccionado.value!.nombre = itemEdicion.value.nombre;
    GalponSeleccionado.value!.ordenDescendente = itemEdicion.value.ordenDescendente;
    await TablesDbService.Actualizar('galpones', GalponSeleccionado.value!);
    await TablesDbService.RegistrarHistorial(GalponSeleccionado.value!.id, '[Galpón] Modificado', nombreAnterior, itemEdicion.value.nombre);
  } else {
    const estante = GalponSeleccionado.value!.estantes.find(e => e.id === itemEdicion.value.id);
    if (estante) {
      const nombreAnterior = estante.nombre;
      estante.nombre = itemEdicion.value.nombre;
      estante.ordenDescendente = itemEdicion.value.ordenDescendente;
      await TablesDbService.Actualizar('galpones', GalponSeleccionado.value!);
      await TablesDbService.RegistrarHistorial(itemEdicion.value.id, '[Estante] Modificado', nombreAnterior, itemEdicion.value.nombre);
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Estante) {
  EstanteSeleccionado.value = item;
  router.push({ name: 'Estante', params: { estante: item.id } });
}

function Editar(item: ItemOrdenable, editandoGalpon = false) {
  esNuevo.value = false;
  esEditandoGalpon.value = editandoGalpon;
  itemEdicion.value = { id: item.id, nombre: item.nombre, ordenDescendente: item.ordenDescendente };
  dialogVisible.value = true;
}

function Quitar(item: Estante): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Estante: "${item.nombre}" y sus descendientes?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      await TablesDbService.RegistrarHistorial(item.id, '[Estante] Eliminado', item.nombre, null);
      GalponSeleccionado.value!.estantes = GalponSeleccionado.value!.estantes.filter(e => e.id !== item.id);
      await TablesDbService.Actualizar('galpones', GalponSeleccionado.value!);
    }
  });
}
</script>

<template>
  <div class="flex justify-between items-center mb-10">
    <Button severity="secondary" variant="outlined" @click="() => router.push('/galpones')">
      <span class="p-button-icon p-button-icon-left pi pi-arrow-left" />
      <span class="p-button-label hidden md:inline">Galpones</span>
    </Button>
    <div class="text-xl">GALPÓN {{GalponSeleccionado!.nombre}}</div>
    <div>
      <Button v-if="Usuario" severity="success" variant="outlined" class="mr-2" @click="Editar(GalponSeleccionado!, true)" v-tooltip.bottom="'Editar Galpón'">
        <span class="p-button-icon p-button-icon-left pi pi-pen-to-square" />
        <span class="p-button-label hidden md:inline">Galpón</span>
      </Button>
      <Button v-if="Usuario" label="Estante" class="w-auto" severity="info" variant="outlined" @click="Agregar" v-tooltip.bottom="'Agregar Estante'">
        <span class="p-button-icon p-button-icon-left pi pi-plus" />
        <span class="p-button-label hidden md:inline">Estante</span>
      </Button>
    </div>
  </div>

  <div v-if="estantes.length === 0" class="italic text-muted-color">No hay estantes en este Galpón</div>
  <div class="flex flex-wrap gap-2 justify-center">
    <div v-for="item in estantes" :key="item.id"
      class="flex justify-between border-1 rounded-md border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 p-0 md:p-2">
      <Button variant="text" @click="Ver(item)" v-tooltip.bottom="'Ver Estante'">
        <div>
          <i class="pi pi-server text-6xl mb-4"></i>
          <div>{{ 'Estante ' + item.nombre }}</div>
        </div>
      </Button>
      <EditarQuitar v-if="Usuario" @editar-click="Editar(item)" @quitar-click="Quitar(item)" :vertical="true" :id-elemento="item.id" :nombre-elemento="item.nombre" />
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Estante"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full">
        <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" aria-autocomplete="none"  @keyup.enter="Guardar" />
        <label for="nombre">Estante</label>
      </FloatLabel>
      <div class="flex gap-2 items-center">
        <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
        <label for="ordenDescendente">Orden Descendente</label>
      </div>
    </div>
  </DialogoEdicion>
</template>
