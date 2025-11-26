<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import EditarQuitar from '../componentes/EditarQuitar.vue';

const confirm = useConfirm();
const router = useRouter();

const estantes = ref<Inventario[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: router.currentRoute.value.params.id as string, producto: null, cantidad: null });
const esNuevo = ref(false);

onMounted(async () => {
  estantes.value = await TablesDbService.ObtenerBodega(router.currentRoute.value.params.id as string);
})

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: router.currentRoute.value.params.id as string, producto: null, cantidad: null };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('inventario', itemEdicion.value);
    estantes.value.push({ ...itemEdicion.value });
  } else {
    const indice = estantes.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('inventario', itemEdicion.value);
      estantes.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Inventario) {
  router.push({ name: 'Estante', params: { galpon: router.currentRoute.value.params.id, estante: item.actual } });
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
      }
    }
  });
}
</script>

<template>
  <div class="flex justify-between items-center mb-3">
    <Button label="Bodega" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push('/bodega')" />
    <div class="text-xl">GALPÓN {{$route.params.id}}</div>
    <Button label="Estante" icon="pi pi-plus" class="w-auto" severity="info" variant="outlined" @click="Agregar" />
  </div>

  <div class="flex flex-wrap gap-3">
    <Card v-for="item in estantes" :key="item.$id" class="w-full md:w-2xs">
      <template #content>
        <div class="flex justify-between">
          <Button class="text-lg" icon="pi pi-server" variant="text" :label="'Estante ' + item.actual" @click="Ver(item)" />
          <EditarQuitar @editar-click="Editar(item)" @quitar-click="Quitar(item)" />
        </div>
      </template>
    </Card>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Estante</label>
      <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none"  @keyup.enter="Guardar" />
    </FloatLabel>
  </DialogoEdicion>
</template>
