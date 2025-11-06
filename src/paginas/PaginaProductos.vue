<script setup lang="ts">
import * as ServicioBase from '@/servicios/ServicioBase.ts';
import type { Fabricante, Grupo, Producto } from '@/servicios/modelos.ts';
import { onMounted, ref, watchEffect } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import { useConfirm } from "primevue/useconfirm";

const confirm = useConfirm();

const grupos = ref<Grupo[]>([]);
const fabricantes = ref<Fabricante[]>([]);
const productos = ref<Producto[]>([]);
const productosFiltrados = ref<Producto[]>([]);

const filtroGrupo = ref<Grupo | null>(null);
const filtroFabricante = ref<Fabricante | null>(null);
const filtroNombre = ref<string>('');

const dialogVisible = ref(false);
const itemEdicion = ref<Producto>();
const esNuevo = ref(false);

const grupoDict = ref<Record<string, string>>({});
const fabricanteDict = ref<Record<string, string>>({});

onMounted(async () => {
  grupos.value = await ServicioBase.ObtenerTodos<Grupo>('grupos');
  fabricantes.value = await ServicioBase.ObtenerTodos<Fabricante>('fabricantes');
  productos.value = await ServicioBase.ObtenerTodos<Producto>('productos');

  grupoDict.value = Object.fromEntries(grupos.value.map(x => [x.$id, x.nombre]));;
  fabricanteDict.value = Object.fromEntries(fabricantes.value.map(x => [x.$id, x.nombre]));
})

watchEffect(() => {
  productosFiltrados.value = productos.value.filter(p => {
    return (filtroNombre.value.trim() === '' || p.nombre.toLowerCase().includes(filtroNombre.value.toLowerCase()))
      && (filtroGrupo.value === null || p.grupo === filtroGrupo.value.$id)
      && (filtroFabricante.value === null || p.fabricante === filtroFabricante.value.$id);
  });
  productosFiltrados.value.sort((a,b) => a.nombre.localeCompare(b.nombre));
});

function Agregar() {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '', grupo: '', fabricante: '', codigo: '', descripcion: null, pesoUnitario: null };
  dialogVisible.value = true;
}

async function Guardar() {
  try {
  if (esNuevo.value) {
    await ServicioBase.Crear('productos', itemEdicion.value!);
    productos.value.push({ ...itemEdicion.value! });
    dialogVisible.value = false;
  } else {
    const indice = productos.value.findIndex(x => x.$id === itemEdicion.value!.$id);
    if (indice >= 0) {
      await ServicioBase.Actualizar('productos', itemEdicion.value!);
      productos.value[indice] = { ...itemEdicion.value! };
      dialogVisible.value = false;
    }
  }
  } catch (error) {
    console.error('Error al guardar el producto:', error);
  }
}

function Editar(item: Producto) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

function Quitar(item: Producto): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar: "${item.nombre}"?`,
    acceptClass: 'p-button-danger',
    acceptIcon: 'pi pi-trash',
    accept: () => {
      const indice = productos.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        ServicioBase.Eliminar('productos', item.$id).then(() => {
          productos.value.splice(indice, 1);
        });
      }
    }
  });
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center mb-3">
    <div class="text-xl mr-4">Productos</div>
    <IconField>
      <InputIcon class="pi pi-search" />
      <InputText v-model="filtroNombre" placeholder="Buscar por nombre" />
    </IconField>
    <Select v-model="filtroGrupo" :options="grupos" optionLabel="nombre" placeholder="Grupo" showClear class="w-full md:w-auto" />
    <Select v-model="filtroFabricante" :options="fabricantes" optionLabel="nombre" placeholder="Fabricante" showClear class="w-full md:w-auto" />
    <Button label="Agregar" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" />
  </div>

  <DataView :value="productosFiltrados">
    <template #list="slotProps">
      <div v-for="item in slotProps.items" :key="item.$id" class="flex flex-col p-1 border-b-1 border-surface">
        <div><b>Nombre:&nbsp;</b>{{ item.nombre }}</div>
        <div><b>Código:&nbsp;</b>{{ item.codigo }}</div>
        <div><b>Grupo:&nbsp;</b>{{ grupoDict[item.grupo] }}</div>
        <div><b>Fabricante:&nbsp;</b>{{ fabricanteDict[item.fabricante] }}</div>
        <div><b>Peso Unitario:&nbsp;</b>{{ item.pesoUnitario }} Kg</div>
        <div><b>Descripción:&nbsp;</b>{{ item.descripcion }}</div>
        <EditarQuitar @editar-click="Editar(item)" @quitar-click="Quitar(item)" />
      </div>
    </template>
  </DataView>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion?.nombre?.trim() === '' || itemEdicion?.codigo?.trim() === '' || itemEdicion?.grupo == undefined || itemEdicion?.fabricante === undefined">
    <div class="flex flex-col gap-3">
      <div class="flex flex-col">
        <label for="nombre">Nombre</label>
        <InputText id="nombre" v-model="itemEdicion!.nombre" autofocus class="w-full" />
      </div>
      <div class="flex flex-col">
        <label for="grupo">Grupo</label>
        <Select id="grupo" v-model="itemEdicion!.grupo" :options="grupos" optionValue="$id" optionLabel="nombre" placeholder="Seleccione un grupo" class="w-full" />
      </div>
      <div class="flex flex-col">
        <label for="fabricante">Fabricante</label>
        <Select id="fabricante" v-model="itemEdicion!.fabricante" :options="fabricantes" optionValue="$id" optionLabel="nombre" placeholder="Seleccione un fabricante" class="w-full" />
      </div>
      <div class="flex flex-col">
        <label for="codigo">Código</label>
        <InputText id="codigo" v-model="itemEdicion!.codigo" class="w-full" />
      </div>
      <div class="flex flex-col">
        <label for="pesoUnitario">Peso Unitario (kg)</label>
        <InputNumber id="pesoUnitario" v-model="itemEdicion!.pesoUnitario" mode="decimal" :minFractionDigits="1" :maxFractionDigits="1" class="w-full" />
      </div>
      <div class="flex flex-col">
        <label for="descripcion">Descripción</label>
        <Textarea id="descripcion" v-model="itemEdicion!.descripcion" class="w-full" rows="2" />
      </div>
    </div>
  </DialogoEdicion>
</template>
