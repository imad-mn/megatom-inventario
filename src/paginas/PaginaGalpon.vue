<script setup lang="ts">
import * as ServicioBase from '@/servicios/ServicioBase.ts';
import type { Galpon, Estante } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import { Button } from 'primevue';

const confirm = useConfirm();
const router = useRouter();

const galpon = ref<Galpon | null>(null);
const dialogVisible = ref(false);
const itemEdicion = ref<Estante>({ $id: '', nombre: '', secciones: [] });
const esNuevo = ref(false);

onMounted(async () => {
  galpon.value = await ServicioBase.ObtenerUno<Galpon>('galpones', router.currentRoute.value.params.id as string, 'estantes');
})

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '', secciones: [] };
  dialogVisible.value = true;
}

async function Guardar() {
  if (!galpon.value) return;

  if (esNuevo.value) {
    await ServicioBase.Crear('estantes', itemEdicion.value);
    galpon.value.estantes.push({ ...itemEdicion.value });
  } else {
    const indice = galpon.value.estantes.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await ServicioBase.Actualizar('estantes', itemEdicion.value);
      galpon.value.estantes[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Estante) {
  router.push({ name: 'Estante', params: { id: item.$id } });
}

function Editar(item: Estante) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Estante): void {


  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Estante: ${item.nombre} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      if (!galpon.value) return;
      const indice = galpon.value.estantes.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        await ServicioBase.Eliminar('estantes', item.$id);
        galpon.value.estantes.splice(indice, 1);
      }
    }
  });
}
</script>

<template>
  <div class="flex  justify-between items-center mb-3">
    <div></div>
    <div class="text-2xl">GALPÓN {{galpon?.nombre}}</div>
    <Button label="Agregar Estante" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" />
  </div>

  <DataView :value="galpon?.estantes">
    <template #list="slotProps">
      <div class="flex flex-wrap gap-3">
        <Card v-for="item in slotProps.items" :key="item.$id" class="w-2xs">
          <template #content>
            <div class="flex justify-between">
              <Button class="text-lg" icon="pi pi-server" variant="text" :label="'Estante ' + item.nombre" @click="Ver(item)" />
              <div>
                <Button icon="pi pi-pen-to-square" severity="success" class="mr-1" variant="text" @click="Editar(item)" />
                <Button icon="pi pi-trash" severity="danger" variant="text" @click="Quitar(item)" />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </DataView>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Nombre</label>
      <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" />
    </FloatLabel>
  </DialogoEdicion>
</template>
