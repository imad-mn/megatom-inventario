<script setup lang="ts">
import * as ServicioBase from '@/servicios/ServicioBase.ts';
import type { Galpon } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import { useRouter } from 'vue-router';
import { Button } from 'primevue';

const confirm = useConfirm();
const router = useRouter();

const galpones = ref<Galpon[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Galpon>({ $id: '', nombre: '', estantes: [] });
const esNuevo = ref(false);

onMounted(async () => {
  galpones.value = await ServicioBase.ObtenerTodos<Galpon>('galpones');
})

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '', estantes: [] };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await ServicioBase.Crear('galpones', itemEdicion.value);
    galpones.value.push({ ...itemEdicion.value });
  } else {
    const indice = galpones.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await ServicioBase.Actualizar('galpones', itemEdicion.value);
      galpones.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Ver(item: Galpon) {
  router.push({ name: 'Galpón', params: { id: item.$id } });
}

function Editar(item: Galpon) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Galpon): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar el Galpón: ${item.nombre} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: () => {
      const indice = galpones.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        ServicioBase.Eliminar('galpones', item.$id).then(() => {
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
    <Button label="Agregar Galpón" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" />
  </div>

  <DataView :value="galpones">
    <template #list="slotProps">
      <div class="flex flex-wrap gap-3">
        <Card v-for="item in slotProps.items" :key="item.$id" class="w-2xs">
          <template #content>
            <div class="flex justify-between">
              <Button class="text-lg" icon="pi pi-warehouse" variant="text" :label="'Galpón ' + item.nombre" @click="Ver(item)" />
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
