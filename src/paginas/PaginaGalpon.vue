<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { Usuario } from '@/servicios/appwrite';

const confirm = useConfirm();
const router = useRouter();
const galpon = (router.currentRoute.value.params.id as string).split('-');

const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', nombre: '', padre: galpon[0] ?? '', nivel: null, ordenDescendente: false });
const esNuevo = ref(false);

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '', padre: galpon[0] ?? '', nivel: 3, ordenDescendente: false };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('inventario', itemEdicion.value);
    TablesDbService.Inventarios.value.push({ ...itemEdicion.value });
  } else {
    const indice = TablesDbService.Inventarios.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('inventario', itemEdicion.value);
      TablesDbService.Inventarios.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Inventario) {
  router.push({ name: 'Estante', params: { estante: `${item.$id}-${item.padre}-${item.nombre}-${item.nivel}-${item.ordenDescendente}-${galpon[1]}` } });
}

function Editar(item: Inventario) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Estante: ${item.nombre} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      const indice = TablesDbService.Inventarios.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        await TablesDbService.Eliminar('inventario', item.$id);
        TablesDbService.Inventarios.value.splice(indice, 1);
      }
    }
  });
}
</script>

<template>
  <div class="flex justify-between items-center mb-3">
    <Button label="Galpones" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push('/galpones')" />
    <div class="text-xl">GALPÓN {{galpon[1]}}</div>
    <div><Button v-if="Usuario" label="Estante" icon="pi pi-plus" class="w-auto" severity="info" variant="outlined" @click="Agregar" /></div>
  </div>
  <div v-if="TablesDbService.Inventarios.value.filter(x => x.padre == galpon[0]).length === 0" class="italic text-muted-color">No hay estantes en este Galpón</div>
  <div class="flex flex-wrap gap-3">
    <div v-for="item in TablesDbService.Inventarios.value.filter(x => x.padre == galpon[0])" :key="item.$id" class="w-full md:w-2xs flex justify-between border-1 rounded-md border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 p-2">
      <Button class="text-lg" icon="pi pi-server" variant="text" :label="'Estante ' + item.nombre" @click="Ver(item)" />
      <EditarQuitar v-if="Usuario" @editar-click="Editar(item)" @quitar-click="Quitar(item)" />
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Estante"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full">
        <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" aria-autocomplete="none"  @keyup.enter="Guardar" />
        <label for="nombre">Estante</label>
      </FloatLabel>
      <FloatLabel variant="on" class="w-full">
        <InputNumber id="niveles" v-model="itemEdicion.nivel" class="w-full" :invalid="!itemEdicion?.nivel" aria-autocomplete="none" @keyup.enter="Guardar" showButtons :min="1" />
        <label for="niveles">Niveles</label>
      </FloatLabel>
      <div class="flex gap-2 items-center">
        <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
        <label for="ordenDescendente">Orden Descendente</label>
      </div>
    </div>
  </DialogoEdicion>
</template>
