<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useConfirm } from "primevue/useconfirm";
import type { IdNombre } from '@/servicios/modelos.ts';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import * as ServicioBase from '@/servicios/ServicioBase.ts';
import DialogoEdicion from './DialogoEdicion.vue';

interface ListaEditableProps {
  nombreTabla: string;
}
const props = defineProps<ListaEditableProps>();
const confirm = useConfirm();

const lista = ref<IdNombre[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<IdNombre>({ $id: '', nombre: '' });
const esNuevo = ref(false);

onMounted(async () => {
  lista.value = await ServicioBase.ObtenerTodos<IdNombre>(props.nombreTabla.toLowerCase());
});

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '' };
  dialogVisible.value = true;
}

function Editar(item: IdNombre) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await ServicioBase.Crear(props.nombreTabla.toLowerCase(), itemEdicion.value);
    lista.value.push({ ...itemEdicion.value });
  } else {
    const indice = lista.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await ServicioBase.Actualizar(props.nombreTabla.toLowerCase(), itemEdicion.value);
      lista.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Quitar(item: IdNombre): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar: "${item.nombre}"?`,
    acceptClass: 'p-button-danger',
    acceptIcon: 'pi pi-trash',
    accept: () => {
      const indice = lista.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        ServicioBase.Eliminar(props.nombreTabla.toLowerCase(), item.$id).then(() => {
          lista.value.splice(indice, 1);
        });
      }
    }
  });
}
</script>

<template>
  <Panel :header="props.nombreTabla" class="w-full md:w-sm">
    <template #icons>
      <Button label="Agregar" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar" />
    </template>
    <DataView :value="lista" dataKey="id">
      <template #list="slotProps">
        <div v-for="item in slotProps.items" :key="item.id" class="flex items-center justify-between p-1 border-b-1 border-surface">
          <div>{{ item.nombre }}</div>
          <EditarQuitar @editar-click="Editar(item)" @quitar-click="Quitar(item)" />
        </div>
      </template>
    </DataView>
  </Panel>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Nombre</label>
      <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre"/>
    </FloatLabel>
  </DialogoEdicion>
</template>
