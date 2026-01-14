<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { Usuario } from '@/servicios/appwrite';

const confirm = useConfirm();
const router = useRouter();

const estantes = ref<Inventario[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: router.currentRoute.value.params.id as string, nivel: null });
const esNuevo = ref(false);

onMounted(() => {
  estantes.value = TablesDbService.ObtenerBodega(router.currentRoute.value.params.id as string);
})

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: router.currentRoute.value.params.id as string, nivel: 3 };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('inventario', itemEdicion.value);
    estantes.value.push({ ...itemEdicion.value });
    TablesDbService.GlobalStorage.Inventarios.push({ ...itemEdicion.value });
  } else {
    const indice = estantes.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('inventario', itemEdicion.value);
      estantes.value[indice] = { ...itemEdicion.value };
      const globalIndice = TablesDbService.GlobalStorage.Inventarios.findIndex(x => x.$id === itemEdicion.value.$id);
      if (globalIndice >= 0) {
        TablesDbService.GlobalStorage.Inventarios[globalIndice] = { ...itemEdicion.value };
      }
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Inventario) {
  router.push({ name: 'Estante', params: { estante: `${item.$id}-${item.padre}-${item.actual}-${item.nivel}` } });
}

function Editar(item: Inventario) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Estante: ${item.actual} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      const indice = estantes.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        await TablesDbService.Eliminar('inventario', item.$id);
        estantes.value.splice(indice, 1);
        const globalIndice = TablesDbService.GlobalStorage.Inventarios.findIndex(x => x.$id === item.$id);
        if (globalIndice >= 0) {
          TablesDbService.GlobalStorage.Inventarios.splice(globalIndice, 1);
        }
      }
    }
  });
}
</script>

<template>
  <div class="flex justify-between items-center mb-3">
    <Button label="Galpones" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push('/galpones')" />
    <div class="text-xl">GALPÓN {{$route.params.id}}</div>
    <div><Button v-if="Usuario" label="Estante" icon="pi pi-plus" class="w-auto" severity="info" variant="outlined" @click="Agregar" /></div>
  </div>
  <div v-if="estantes.length === 0" class="italic text-muted-color">No hay estantes en este Galpón</div>
  <div class="flex flex-wrap gap-3">
    <div v-for="item in estantes" :key="item.$id" class="w-full md:w-2xs flex justify-between border-1 rounded-md border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 p-2">
      <Button class="text-lg" icon="pi pi-server" variant="text" :label="'Estante ' + item.actual" @click="Ver(item)" />
      <EditarQuitar v-if="Usuario" @editar-click="Editar(item)" @quitar-click="Quitar(item)" />
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Estante"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full">
        <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none"  @keyup.enter="Guardar" />
        <label for="nombre">Estante</label>
      </FloatLabel>
      <FloatLabel variant="on" class="w-full">
        <InputNumber id="niveles" v-model="itemEdicion.nivel" class="w-full" :invalid="!itemEdicion?.nivel" aria-autocomplete="none" @keyup.enter="Guardar" showButtons :min="1" />
        <label for="niveles">Niveles</label>
      </FloatLabel>
    </div>
  </DialogoEdicion>
</template>
