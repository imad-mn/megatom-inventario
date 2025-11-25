<script setup lang="ts">
import * as ServicioBase from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import { Button } from 'primevue';
import EditarQuitar from '../componentes/EditarQuitar.vue';

const confirm = useConfirm();
const router = useRouter();

const galpones = ref<Inventario[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: null, producto: null, cantidad: null });
const esNuevo = ref(false);

onMounted(async () => {
  galpones.value = await ServicioBase.ObtenerConFiltro<Inventario>('inventario', 'padre', null);
})

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: null, producto: null, cantidad: null };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await ServicioBase.Crear('inventario', itemEdicion.value);
    galpones.value.push({ ...itemEdicion.value });
  } else {
    const indice = galpones.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await ServicioBase.Actualizar('inventario', itemEdicion.value);
      galpones.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Inventario) {
  router.push({ name: 'Galpón', params: { id: item.actual } });
}

function Editar(item: Inventario) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Galpón: ${item.actual} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: () => {
      const indice = galpones.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        ServicioBase.Eliminar('inventario', item.$id).then(() => {
          galpones.value.splice(indice, 1);
        });
      }
    }
  });
}
</script>

<template>
  <div class="flex  justify-between items-center mb-3">
    <div></div>
    <div class="text-2xl">BODEGA</div>
    <Button label="Galpón" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" />
  </div>

  <div class="flex flex-wrap gap-3">
    <Card v-for="item in galpones" :key="item.$id" class="w-full md:w-2xs">
      <template #content>
        <div class="flex justify-between">
          <Button class="text-lg" icon="pi pi-warehouse" variant="text" :label="'Galpón ' + item.actual" @click="Ver(item)" />
          <EditarQuitar @editar-click="Editar(item)" @quitar-click="Quitar(item)" />
        </div>
      </template>
    </Card>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Galpón</label>
      <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none" />
    </FloatLabel>
  </DialogoEdicion>
</template>
