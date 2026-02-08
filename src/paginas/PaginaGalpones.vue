<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { computed, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import { Button } from 'primevue';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { Usuario } from '@/servicios/appwrite';

const confirm = useConfirm();
const router = useRouter();

const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', tipo: 'Galpon', nombre: '', padre: null, ordenDescendente: false });
const esNuevo = ref(false);

const galpones = computed(() => TablesDbService.Inventarios.value.filter(x => x.padre === null));

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', tipo: 'Galpon', nombre: '', padre: null, ordenDescendente: false };
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
  router.push({ name: 'Galpón', params: { id: `${item.$id}-${item.nombre}-${item.ordenDescendente}` } });
}

function Editar(item: Inventario) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Galpón: "${item.nombre}" y sus descendientes?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => await TablesDbService.EliminarItemInventario(item)
  });
}
</script>

<template>
  <div class="flex  justify-between items-center mb-10">
    <div></div>
    <div class="text-xl justify-self-center">GALPONES</div>
    <div>
      <Button v-if="Usuario" label="Galpón" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" v-tooltip.bottom="'Agregar Galpón'" />
    </div>
  </div>

  <div v-if="galpones.length === 0" class="italic text-muted-color mt-3">No hay galpones</div>
  <div class="flex flex-wrap gap-3 justify-center">
    <div v-for="item in galpones" :key="item.$id"
      class="flex justify-between border-1 rounded-md border-gray-300 bg-gray-100 dark:bg-gray-900 dark:border-gray-700 p-2">
      <Button variant="text" @click="Ver(item)" v-tooltip.bottom="'Ver Galpón'">
        <div>
          <i class="pi pi-warehouse text-7xl mb-4"></i>
          <div>{{ 'Galpón ' + item.nombre }}</div>
        </div>
      </Button>
      <EditarQuitar v-if="Usuario" @editar-click="Editar(item)" @quitar-click="Quitar(item)" :vertical="true" />
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Galpón"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full mt-1">
        <label for="nombre">Galpón</label>
        <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" aria-autocomplete="none"  @keyup.enter="Guardar" />
      </FloatLabel>
      <div class="flex gap-2 items-center">
        <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
        <label for="ordenDescendente">Orden Descendente</label>
      </div>
    </div>
  </DialogoEdicion>
</template>
