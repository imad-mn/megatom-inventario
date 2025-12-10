<script setup lang="ts">
import * as ServicioBase from '@/servicios/TablesDbService';
import type { Lista, Producto } from '@/servicios/modelos.ts';
import { onMounted, ref, watchEffect } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import type { FileUploadSelectEvent } from 'primevue';
import FileUpload from 'primevue/fileupload';
import * as StorageService from '@/servicios/StorageService.ts';

const confirm = useConfirm();

const grupos = ref<Lista[]>([]);
const fabricantes = ref<Lista[]>([]);
const productos = ref<Producto[]>([]);
const productosFiltrados = ref<Producto[]>([]);

const filtroGrupo = ref<Lista | null>(null);
const filtroFabricante = ref<Lista | null>(null);
const filtroNombre = ref<string>('');

const dialogVisible = ref(false);
const itemEdicion = ref<Producto>();
const esNuevo = ref(false);

const grupoDict = ref<Record<string, string>>({});
const fabricanteDict = ref<Record<string, string>>({});

const fileUploadRef = ref<InstanceType<typeof FileUpload> | null>(null);
let archivo: File | undefined;
const imagenEdicion = ref<string>();
const mostrarAdvertencia = ref(false);

onMounted(async () => {
  grupos.value = await ServicioBase.ObtenerLista('grupos');
  fabricantes.value = await ServicioBase.ObtenerLista('fabricantes');
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
  imagenEdicion.value = undefined;
  itemEdicion.value = { $id: '', nombre: '', grupo: '', fabricante: '', codigo: '', descripcion: null, pesoUnitario: null, imagenId: null };
  dialogVisible.value = true;
  mostrarAdvertencia.value = false;
}

async function Guardar() {
  try {
    if (itemEdicion.value == undefined)
      return;

    if (archivo) {
      itemEdicion.value!.imagenId = await StorageService.Subir(archivo);
      archivo = undefined;
    }

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
  imagenEdicion.value = item.imagenId ? StorageService.Url(item.imagenId) : undefined;
  dialogVisible.value = true;
  mostrarAdvertencia.value = false;
}

function Quitar(item: Producto): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar: "${item.nombre}"?`,
    acceptClass: 'p-button-danger p-button-outlined',
    acceptIcon: 'pi pi-trash',
    rejectClass: 'p-button-secondary p-button-outlined',
    accept: () => {
      const indice = productos.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        ServicioBase.Eliminar('productos', item.$id).then(() => {
          productos.value.splice(indice, 1);
        });
        StorageService.Eliminar(item.$id).catch(error => {
          console.error('Error al eliminar la imagen del producto:', error);
        });
      }
    }
  });
}

// Al seleccionar la foto, la muestra en el diálogo de edición
function SeleccionarFoto(e: FileUploadSelectEvent) {
  archivo = (<File[]>e.files)[0];
  if (archivo == null)
      return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    if (e.target?.result)
      imagenEdicion.value = <string>e.target.result;
  };
  reader.readAsDataURL(archivo);
}

function RevisarNombreUnico() {
  if (productos.value.findIndex(x => x.nombre == itemEdicion.value?.nombre) >= 0)
    mostrarAdvertencia.value = true;
  else
    mostrarAdvertencia.value = false;
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center mb-3">
    <div class="text-xl mr-3">Productos</div>
    <Button label="Agregar" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" />
    <IconField class="w-full md:w-auto">
      <InputIcon class="pi pi-search" />
      <InputText v-model="filtroNombre" placeholder="Buscar por nombre" class="w-full md:w-auto" />
    </IconField>
    <Select v-model="filtroGrupo" :options="grupos" optionLabel="nombre" placeholder="Grupo" showClear class="w-full md:w-auto" />
    <Select v-model="filtroFabricante" :options="fabricantes" optionLabel="nombre" placeholder="Fabricante" showClear class="w-full md:w-auto" />
  </div>

  <DataView :value="productosFiltrados">
    <template #list="slotProps">
      <div class="grid grid-col-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card v-for="item in slotProps.items" :key="item.$id" style="overflow: hidden">
          <template #header>
            <img v-if="item.imagenId" :src="StorageService.Url(item.imagenId)" alt="Foto" />
          </template>
          <template #title>{{ item.nombre }}</template>
          <template #subtitle>{{ item.descripcion }}</template>
          <template #content>
            <div><b>Código:&nbsp;</b>{{ item.codigo }}</div>
            <div><b>Grupo:&nbsp;</b>{{ grupoDict[item.grupo] }}</div>
            <div><b>Fabricante:&nbsp;</b>{{ fabricanteDict[item.fabricante] }}</div>
            <div><b>Peso Unitario:&nbsp;</b>{{ item.pesoUnitario?.toFixed(2) }} Kg</div>
          </template>
          <template #footer>
            <div class="flex gap-5">
              <Button icon="pi pi-pen-to-square" label="Editar" severity="success" size="small" variant="outlined" class="w-full" @click="Editar(item)" />
              <Button icon="pi pi-trash" label="Eliminar" severity="danger" size="small" variant="outlined" class="w-full" @click="Quitar(item)" />
            </div>
          </template>
        </Card>
      </div>
    </template>
  </DataView>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Producto"
    :desabilitarAceptar="itemEdicion?.nombre?.trim() === '' || itemEdicion?.grupo == undefined || itemEdicion?.fabricante === undefined || mostrarAdvertencia">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on">
        <InputText id="nombre" v-model="itemEdicion!.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" @change="RevisarNombreUnico" />
        <label for="nombre">Nombre</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select id="grupo" v-model="itemEdicion!.grupo" :options="grupos" optionValue="$id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.grupo" />
        <label for="grupo">Grupo</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select id="fabricante" v-model="itemEdicion!.fabricante" :options="fabricantes" optionValue="$id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.fabricante" />
        <label for="fabricante">Fabricante</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="codigo" v-model="itemEdicion!.codigo" class="w-full" />
        <label for="codigo">Código</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputNumber id="pesoUnitario" v-model="itemEdicion!.pesoUnitario" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="w-full" />
        <label for="pesoUnitario">Peso Unitario (kg)</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Textarea id="descripcion" v-model="itemEdicion!.descripcion" class="w-full" rows="2" />
        <label for="descripcion">Descripción</label>
      </FloatLabel>
      <FileUpload
        ref="fileUploadRef"
        mode="basic"
        :file-limit="1"
        accept="image/*"
        :maxFileSize="524288"
        choose-label="Escoger Foto"
        :custom-upload="true"
        class="p-button-outlined"
        @select="SeleccionarFoto" />
      <img v-if="imagenEdicion" :src="imagenEdicion" alt="Foto" class="rounded-xl w-full" />
      <Message severity="warn" v-if="mostrarAdvertencia">Ya existe un producto con ese nombre</Message>
    </div>
  </DialogoEdicion>
</template>
