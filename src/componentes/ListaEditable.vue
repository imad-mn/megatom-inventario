<script setup lang="ts">
import { computed, ref } from 'vue';
import { useConfirm } from "primevue/useconfirm";
import type { Lista, TipoLista } from '@/servicios/modelos.ts';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import * as TablesDbService from '@/servicios/TablesDbService';
import DialogoEdicion from './DialogoEdicion.vue';

interface ListaEditableProps {
  tipo: TipoLista;
}
const props = defineProps<ListaEditableProps>();
const confirm = useConfirm();

const dialogVisible = ref(false);
const itemEdicion = ref<Lista>({ $id: '', tipo: props.tipo, nombre: '' });
const esNuevo = ref(false);

const itemsFiltrados = computed(() =>
  TablesDbService.Listas.value.filter(x => x.tipo === props.tipo)
);

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '', tipo: props.tipo };
  dialogVisible.value = true;
}

function Editar(item: Lista) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('listas', itemEdicion.value);
    const tipoElemento = props.tipo === 'fabricantes' ? 'Fabricante' : props.tipo === 'grupos' ? 'Grupo' : 'Almacenista';
    await TablesDbService.RegistrarHistorial(itemEdicion.value.$id, `[${tipoElemento}] Creado: ${itemEdicion.value.nombre}`);
    TablesDbService.Listas.value.push({ ...itemEdicion.value });
  } else {
    const indice = TablesDbService.Listas.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('listas', itemEdicion.value);
      const tipoElemento = props.tipo === 'fabricantes' ? 'Fabricante' : props.tipo === 'grupos' ? 'Grupo' : 'Almacenista';
      await TablesDbService.RegistrarHistorial(itemEdicion.value.$id, `[${tipoElemento}] Modificado: ${itemEdicion.value.nombre}`);
      TablesDbService.Listas.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Quitar(item: Lista): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar: "${item.nombre}"?`,
    acceptClass: 'p-button-danger p-button-outlined',
    acceptIcon: 'pi pi-trash',
    rejectClass: 'p-button-secondary p-button-outlined',
    accept: async () => {
      const indice = TablesDbService.Listas.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        const tipoElemento = props.tipo === 'fabricantes' ? 'Fabricante' : props.tipo === 'grupos' ? 'Grupo' : 'Almacenista';
        await TablesDbService.RegistrarHistorial(item.$id, `[${tipoElemento}] Eliminado: ${item.nombre}`);
        await TablesDbService.Eliminar('listas', item.$id);
        TablesDbService.Listas.value.splice(indice, 1);
      }
    }
  });
}
</script>

<template>
  <Panel :header="props.tipo.charAt(0).toUpperCase() + props.tipo.substring(1)" class="w-full md:w-sm">
    <template #icons>
      <Button label="Agregar" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar" />
    </template>
    <div v-for="item in itemsFiltrados" :key="item.$id" class="flex items-center justify-between p-1 border-b border-surface-200 dark:border-surface-700">
      <div>{{ item.nombre }}</div>
      <EditarQuitar tamaño="small" @editar-click="Editar(item)" @quitarClick="Quitar(item)" />
    </div>
  </Panel>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" :nombre-objeto="props.tipo"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Nombre</label>
      <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre"  @keyup.enter="Guardar" />
    </FloatLabel>
  </DialogoEdicion>
</template>
