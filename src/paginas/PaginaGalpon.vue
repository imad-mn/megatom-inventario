<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { ref, watchEffect } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { Usuario } from '@/servicios/appwrite';

const confirm = useConfirm();
const router = useRouter();
const galponQueryString = (router.currentRoute.value.params.id as string).split('-');
const galpon: Inventario = { $id: galponQueryString[0] ?? '', padre: null, tipo: 'Galpon', nombre: galponQueryString[1] ?? '', ordenDescendente: galponQueryString[2] === 'true' };

const estantes = ref<Inventario[]>([]);
watchEffect(() =>
  estantes.value = TablesDbService.Inventarios.value.filter(x => x.padre == galpon.$id)
                  .sort((a, b) => galpon.ordenDescendente ? b.nombre.localeCompare(a.nombre) : a.nombre.localeCompare(b.nombre))
);

const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', tipo: 'Estante', nombre: '', padre: galpon.$id ?? '', ordenDescendente: false });
const esNuevo = ref(false);

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', tipo: 'Estante', nombre: '', padre: galpon.$id ?? '', ordenDescendente: false };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('inventario', itemEdicion.value);
    await TablesDbService.RegistrarHistorial(itemEdicion.value.$id, `[Estante] Creado: ${itemEdicion.value.nombre}`);
    TablesDbService.Inventarios.value.push({ ...itemEdicion.value });
  } else {
    const indice = TablesDbService.Inventarios.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('inventario', itemEdicion.value);
      await TablesDbService.RegistrarHistorial(itemEdicion.value.$id, `[Estante] Modificado: ${itemEdicion.value.nombre}`);
      TablesDbService.Inventarios.value[indice] = { ...itemEdicion.value };
    }
    if (itemEdicion.value.$id === galpon.$id) {
      galpon.nombre = itemEdicion.value.nombre;
      galpon.ordenDescendente = itemEdicion.value.ordenDescendente;
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Inventario) {
  router.push({ name: 'Estante', params: { estante: `${item.$id}-${item.padre}-${item.nombre}-${item.ordenDescendente}-${galpon.nombre}-${galpon.ordenDescendente}` } });
}

function Editar(item: Inventario) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Estante: "${item.nombre}" y sus descendientes?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      await TablesDbService.RegistrarHistorial(item.$id, `[Estante] Eliminado: ${item.nombre}`);
      await TablesDbService.EliminarItemInventario(item);
    }
  });
}
</script>

<template>
  <div class="flex justify-between items-center mb-10">
    <Button label="Galpones" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push('/galpones')" />
    <div class="text-xl">GALPÓN {{galpon.nombre}}</div>
    <div>
      <Button v-if="Usuario" label="Galpón" icon="pi pi-pen-to-square" severity="success" variant="outlined" class="mr-2" @click="Editar(galpon)" v-tooltip.bottom="'Editar Galpón'" />
      <Button v-if="Usuario" label="Estante" icon="pi pi-plus" class="w-auto" severity="info" variant="outlined" @click="Agregar" v-tooltip.bottom="'Agregar Estante'"/>
    </div>
  </div>
  <div v-if="estantes.length === 0" class="italic text-muted-color">No hay estantes en este Galpón</div>
  <div class="flex flex-wrap gap-3 justify-center">
    <div v-for="item in estantes" :key="item.$id"
      class="flex justify-between border-1 rounded-md border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 p-2">
      <Button variant="text" @click="Ver(item)" v-tooltip.bottom="'Ver Estante'">
        <div>
          <i class="pi pi-server text-7xl mb-4"></i>
          <div>{{ 'Estante ' + item.nombre }}</div>
        </div>
      </Button>
      <EditarQuitar v-if="Usuario" @editar-click="Editar(item)" @quitar-click="Quitar(item)" :vertical="true" />
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
