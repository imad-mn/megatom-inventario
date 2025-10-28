<script setup lang="ts">
import { ref } from 'vue';
import { useConfirm } from "primevue/useconfirm";
import type { IdNombre } from '@/modelos';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { ID } from '../appwrite.ts';

interface ListaEditableProps {
  nombreTabla: string,
}
const props = defineProps<ListaEditableProps>();
const confirm = useConfirm();

const lista = ref<IdNombre[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<IdNombre>({ id: '', nombre: '' });
const esNuevo = ref(false);

import myDataRaw from './MOCK_DATA.json';
lista.value = myDataRaw as IdNombre[];

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { id: ID.unique(), nombre: '' };
  dialogVisible.value = true;
}

function Editar(item: IdNombre) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Guardar() {
  if (esNuevo.value) {
    lista.value.push({ ...itemEdicion.value });
  } else {
    const indice = lista.value.findIndex(x => x.id === itemEdicion.value.id);
    if (indice >= 0) {
      lista.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Quitar(item: IdNombre) {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar: "${item.nombre}"?`,
    acceptClass: 'p-button-danger',
    acceptIcon: 'pi pi-trash',
    rejectClass: 'p-button-text',
    accept: () => {
      const indice = lista.value.findIndex(x => x.id === item.id);
      if (indice >= 0) {
        lista.value.splice(indice, 1);
      }
    }
  });
}
</script>

<template>
  <Panel :header="props.nombreTabla" class="w-sm">
    <template #icons>
      <Button label="Agregar" icon="pi pi-plus" severity="info" variant="outlined" size="small" @click="Agregar" />
    </template>
    <DataView :value="lista" dataKey="id">
      <template #list="slotProps">
        <div v-for="item in slotProps.items" :key="item.id" class="flex items-center justify-between p-1 border-b-1 border-surface">
          <div>{{ item.nombre }}</div>
          <EditarQuitar @editar-click="() => Editar(item)" @quitar-click="() => Quitar(item)" />
        </div>
      </template>
    </DataView>
  </Panel>

  <Dialog v-model:visible="dialogVisible" :modal="true" :header="esNuevo ? 'Agregar' : 'Editar'">
    <div class="flex items-center gap-2">
      <label for="nombre">Nombre</label>
      <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="flex-auto" />
    </div>
    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" @click="dialogVisible = false" severity="secondary" />
      <Button label="Guardar" icon="pi pi-check" @click="Guardar" :disabled="!itemEdicion.nombre" />
    </template>
  </Dialog>

  <ConfirmDialog />
</template>
