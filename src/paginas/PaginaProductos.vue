<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Caja, Cantidades, Estante, Galpon, Lista, Nivel, Producto, ProductoConCantidad, Seccion, TipoLista } from '@/servicios/modelos.ts';
import { computed, ref } from 'vue';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import { useConfirm } from "primevue/useconfirm";
import type { FileUploadMethods, FileUploadSelectEvent, FileUploadUploaderEvent } from 'primevue';
import FileUpload from 'primevue/fileupload';
import * as StorageService from '@/servicios/StorageService.ts';
import { Importar, Exportar } from '@/servicios/ImportarExportar';
import { useGlobalStore } from '@/servicios/globalStore';
import { useAuthStore } from '@/servicios/authStore';
import { RegistrarHistorial, Stringify } from '@/servicios/historialService';

const confirm = useConfirm();

const globalStore = useGlobalStore();
const authStore = useAuthStore();
const Usuario = authStore.Usuario;

const grupos = ref<Lista[]>(globalStore.ObtenerLista('grupos'));
const fabricantes = ref<Lista[]>(globalStore.ObtenerLista('fabricantes'));
const estados = globalStore.ObtenerLista('estados').map(x => ({ id: x.id, nombre: x.nombre.substring(3), tipo: x.tipo }));

const filtroGrupo = ref<Lista | null>(null);
const filtroFabricante = ref<Lista | null>(null);
const filtroTexto = ref<string>('');

const dialogVisible = ref(false);
const itemEdicion = ref<Producto>();
const esNuevo = ref(false);

const ubicacionDict = ref<Record<string, string[]>>({});

let archivoFoto: File | undefined;
const imagenEdicion = ref<string>();
const mostrarAdvertencia = ref(false);

const dialogoImportar = ref(false);
const fileupload = ref<FileUploadMethods>();
const progresoImportacion = ref(0);
const totalRegistros = ref(0);
const mostrarMensajeImportacion = ref(false);
const errorImportacion = ref('');
const deshabilitarBotonImportar = ref(true);
const permitirCerrarDialogoImportar = ref(true);

 const productosFiltrados = computed(() => {
  const filtrados = globalStore.ObtenerProductosConCantidad().filter(p => {
    return (filtroTexto.value.trim() === ''
        || p.nombre.toLowerCase().includes(filtroTexto.value.toLowerCase())
        || p.descripcion?.toLowerCase().includes(filtroTexto.value.toLowerCase())
        || (p.codigo !== null && p.codigo.toLowerCase().includes(filtroTexto.value.toLowerCase()))
        || (p.grupoId && globalStore.ListasMap[p.grupoId]?.toLowerCase().includes(filtroTexto.value.toLowerCase()))
        || (p.fabricanteId && globalStore.ListasMap[p.fabricanteId]?.toLowerCase().includes(filtroTexto.value.toLowerCase())))
        || (p.estadoId && globalStore.ListasMap[p.estadoId]?.toLowerCase().includes(filtroTexto.value.toLowerCase()))
        || p.pesoUnitario.toString().includes(filtroTexto.value)
      && (filtroGrupo.value === null || p.grupoId === filtroGrupo.value.id)
      && (filtroFabricante.value === null || p.fabricanteId === filtroFabricante.value.id);
  });
  return [...filtrados].sort((a,b) => a.nombre.localeCompare(b.nombre));
});

const galponSeleccionado = ref<Galpon | null>(null);
const estanteSeleccionado = ref<Estante | null>(null);
const nivelSeleccionado = ref<Nivel | null>(null);
const seccionSeleccionada = ref<Seccion | null>(null);
const cajaSeleccionada = ref<Caja | null>(null);
const cantidadInicial = ref<number>(1);

const listaEdicion = ref<Lista>({ id: '', nombre: '', tipo: 'grupos' });
const agregandoLista = ref(false);

function Agregar() {
  esNuevo.value = true;
  imagenEdicion.value = undefined;
  itemEdicion.value = { id: '', nombre: '', grupoId: '', fabricanteId: '', codigo: '', descripcion: null, pesoUnitario: 0, imagenUrl: null, estadoId: null };
  dialogVisible.value = true;
  mostrarAdvertencia.value = false;
  galponSeleccionado.value = null;
  estanteSeleccionado.value = null;
  nivelSeleccionado.value = null;
  seccionSeleccionada.value = null;
  cajaSeleccionada.value = null;
  cantidadInicial.value = 1;
}

async function Guardar() {
  try {
    if (itemEdicion.value == undefined)
      return;

    if (archivoFoto) {
      itemEdicion.value.imagenUrl = await StorageService.Subir(archivoFoto);
      archivoFoto = undefined;
    }

    const productoNuevo = Stringify(itemEdicion.value);
    if (esNuevo.value) {
      await TablesDbService.Crear(TablesDbService.Coleccion.Productos, itemEdicion.value!);
      await RegistrarHistorial(itemEdicion.value!.id, '[Producto] Creado', null, productoNuevo);
      globalStore.Productos.push({ ...itemEdicion.value! });

      if (cajaSeleccionada.value && cantidadInicial.value > 0) {
        const item: Cantidades = {
          id: '',
          productoId: itemEdicion.value.id,
          cantidad: cantidadInicial.value,
          cajaId: cajaSeleccionada.value.id
        };
        await TablesDbService.Crear(TablesDbService.Coleccion.Cantidades, item);
        await RegistrarHistorial(itemEdicion.value!.id, `'${itemEdicion.value!.nombre}' agregado a caja: ${cajaSeleccionada.value.nombre} (${cantidadInicial.value} unidades)`);
      }
      dialogVisible.value = false;
    } else {
      const anterior = globalStore.Productos.find(x => x.id === itemEdicion.value!.id);
      if (anterior) {
        await TablesDbService.Actualizar(TablesDbService.Coleccion.Productos, itemEdicion.value!);
        const productoAnterior = Stringify(anterior);
        await RegistrarHistorial(itemEdicion.value!.id, '[Producto] Modificado', productoAnterior, productoNuevo);
        const indice = globalStore.Productos.indexOf(anterior);
        globalStore.Productos[indice] = { ...itemEdicion.value! };
        dialogVisible.value = false;
      }
    }
  } catch (error) {
    console.error('Error al guardar el producto:', error);
  }
}

async function Editar(item: Producto) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  imagenEdicion.value = item.imagenUrl ?? undefined;
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
    accept: async () => {
      const anterior = globalStore.Productos.find(x => x.id === item.id);
      if (anterior) {
        await TablesDbService.Eliminar(TablesDbService.Coleccion.Productos, item)
        const anteriorJson = Stringify(anterior);
        await RegistrarHistorial(item.id, '[Producto] Eliminado', anteriorJson, null);
        const indice = globalStore.Productos.indexOf(anterior);
        globalStore.Productos.splice(indice, 1);
        await StorageService.Eliminar(item.id);
      }
    }
  });
}

// Al seleccionar la foto, la muestra en el diálogo de edición
function SeleccionarFoto(e: FileUploadSelectEvent) {
  archivoFoto = (<File[]>e.files)[0];
  if (archivoFoto == null)
      return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    if (e.target?.result)
      imagenEdicion.value = <string>e.target.result;
  };
  reader.readAsDataURL(archivoFoto);
}

function RevisarNombreUnico() {
  if (globalStore.Productos.findIndex(x => x.nombre == itemEdicion.value?.nombre) >= 0)
    mostrarAdvertencia.value = true;
  else
    mostrarAdvertencia.value = false;
}

function AbrirDialogoImportar() {
  dialogoImportar.value = true;
  mostrarMensajeImportacion.value = false;
  progresoImportacion.value = 0;
  totalRegistros.value = 0;
}

async function ImportarProductos(e: FileUploadUploaderEvent) {
  const archivo = (<File[]>e.files)[0];
  if (!archivo)
    return;

  errorImportacion.value = '';
  deshabilitarBotonImportar.value = true;
  permitirCerrarDialogoImportar.value = false;
  await Importar(
    archivo,
    (total) => totalRegistros.value = total,
    (progreso) => progresoImportacion.value = progreso,
    () => {
      mostrarMensajeImportacion.value = true;
      permitirCerrarDialogoImportar.value = true;
    },
    (error) => {
      permitirCerrarDialogoImportar.value = true;
      errorImportacion.value = error;
    });
}

function VerUbicacion(productoId: string) {
  const cantidades = globalStore.ObtenerCantidadesPorProducto(productoId);
  const ubicaciones = globalStore.ObtenerUbicaciones(cantidades);
  ubicacionDict.value[productoId] = ubicaciones;
}

function onHistorialClick(item: Producto) {
  globalStore.dialogoHistorial.mostrar = true;
  globalStore.dialogoHistorial.idElemento = item.id;
  globalStore.dialogoHistorial.nombreElemento = item.nombre;
}

async function DescargarExportacion() {
  const csv = await Exportar();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AgregarLista(tipo: TipoLista) {
  listaEdicion.value = { id: '', tipo: tipo, nombre: '' };
  agregandoLista.value = true;
}
async function GuardarLista() {
  await TablesDbService.Crear(TablesDbService.Coleccion.Listas, listaEdicion.value);
  await RegistrarHistorial(listaEdicion.value.id, `[${listaEdicion.value.tipo}] Creado`, null, listaEdicion.value.nombre);
  globalStore.Listas.push({ ...listaEdicion.value });

  if (listaEdicion.value.tipo == 'grupos')
    grupos.value = globalStore.ObtenerLista('grupos');
  else if (listaEdicion.value.tipo == 'fabricantes')
    fabricantes.value = globalStore.ObtenerLista('fabricantes');

  agregandoLista.value = false;
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center mb-3">
    <div class="text-xl mr-3">PRODUCTOS</div>
    <Button v-if="Usuario" label="Agregar" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar" />
    <IconField class="w-full md:w-auto">
      <InputIcon class="pi pi-search" />
      <InputText v-model="filtroTexto" placeholder="Buscar" class="w-full md:w-auto" />
    </IconField>
    <Select v-model="filtroGrupo" :options="grupos" optionLabel="nombre" placeholder="Grupo" showClear class="w-full md:w-auto" />
    <Select v-model="filtroFabricante" :options="fabricantes" optionLabel="nombre" placeholder="Fabricante" showClear class="w-full md:w-auto" />
    <Button v-if="Usuario != null && Usuario.user.displayName != null && ['Imad', 'Giovanni'].includes(Usuario.user.displayName)" label="Importar" icon="pi pi-file-import" severity="success" variant="outlined" @click="AbrirDialogoImportar" v-tooltip.bottom="'Importar productos desde un archivo CSV'" />
    <Button v-if="Usuario != null && Usuario.user.displayName != null && ['Imad', 'Giovanni'].includes(Usuario.user.displayName)" label="Exportar" icon="pi pi-file-export" severity="success" variant="outlined" @click="DescargarExportacion" v-tooltip.bottom="'Exportar productos a un archivo CSV'" />
  </div>

  <DataView :value="productosFiltrados">
    <template #list="slotProps">
      <div class="grid grid-col-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Card v-for="item in slotProps.items as ProductoConCantidad[]" :key="item.id" style="overflow: hidden">
          <template #header>
            <img v-if="item.imagenUrl" :src="item.imagenUrl" alt="Foto" />
          </template>
          <template #title>{{ item.nombre }}</template>
          <template #subtitle>{{ item.descripcion }}</template>
          <template #content>
            <div><b>Código:&nbsp;</b>{{ item.codigo }}</div>
            <b>Grupo:&nbsp;</b>
            <div>{{ item.grupoId ? globalStore.ListasMap[item.grupoId] || '' : '' }}</div>
            <div><b>Fabricante:&nbsp;</b>{{ item.fabricanteId ? globalStore.ListasMap[item.fabricanteId] || '' : '' }}</div>
            <div><b>Peso Unitario:&nbsp;</b>{{ item.pesoUnitario?.toFixed(2) }} Kg</div>
            <div><b>Estado:&nbsp;</b>{{ item.estadoId ? globalStore.ListasMap[item.estadoId] || '' : '' }}</div>
            <div><b>Cantidad:&nbsp;</b>{{ item.cantidad }}</div>
            <Button v-if="!ubicacionDict[item.id]" label="Ver Ubicación" icon="pi pi-server" severity="primary" size="small" variant="outlined" class="w-full mt-1" @click="VerUbicacion(item.id)" />
            <div v-else>
              <div><b>Ubicación:</b></div>
              <ul class="list-disc list-inside">
                <li v-for="(ubic, index) in ubicacionDict[item.id]" :key="index">{{ ubic }}</li>
              </ul>
            </div>
          </template>
          <template #footer v-if="Usuario">
            <div class="flex gap-2">
              <Button icon="pi pi-history" label="Historial" severity="info" size="small" variant="outlined" @click="onHistorialClick(item)" />
              <Button icon="pi pi-pen-to-square" label="Editar" severity="success" size="small" variant="outlined" @click="Editar(item)" />
              <Button icon="pi pi-trash" label="Eliminar" severity="danger" size="small" variant="outlined" @click="Quitar(item)" />
            </div>
          </template>
        </Card>
      </div>
    </template>
  </DataView>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" nombre-objeto="Producto"
    :desabilitarAceptar="itemEdicion?.nombre?.trim() === '' || itemEdicion?.grupoId == undefined || itemEdicion?.fabricanteId === undefined || mostrarAdvertencia">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on">
        <InputText id="nombre" v-model="itemEdicion!.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" @change="RevisarNombreUnico" />
        <label for="nombre">Nombre</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select id="grupo" v-model="itemEdicion!.grupoId" :options="grupos" optionValue="id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.grupoId">
          <template #footer>
            <div class="p-1">
              <Button label="Agregar Grupo" fluid severity="secondary" variant="text" size="small" icon="pi pi-plus" @click="AgregarLista('grupos')" />
            </div>
          </template>
        </Select>
        <label for="grupo">Grupo</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Select id="fabricante" v-model="itemEdicion!.fabricanteId" :options="fabricantes" optionValue="id" optionLabel="nombre" class="w-full" :invalid="!itemEdicion?.fabricanteId">
          <template #footer>
            <div class="p-1">
              <Button label="Agregar Fabricante" fluid severity="secondary" variant="text" size="small" icon="pi pi-plus" @click="AgregarLista('fabricantes')" />
            </div>
          </template>
        </Select>
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
        <Select id="estado" v-model="itemEdicion!.estadoId" :options="estados" optionValue="id" optionLabel="nombre" class="w-full" />
        <label for="estado">Estado</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <Textarea id="descripcion" v-model="itemEdicion!.descripcion" class="w-full" rows="2" />
        <label for="descripcion">Descripción</label>
      </FloatLabel>
      <FileUpload
        mode="basic"
        accept="image/*"
        :maxFileSize="524288"
        choose-label="Escoger Foto"
        :custom-upload="true"
        class="p-button-outlined"
        @select="SeleccionarFoto">
        <template #filelabel>&nbsp;</template>
      </FileUpload>
      <div class="text-sm text-gray-500">Tamaño máximo de la foto: 512 KB.</div>
      <img v-if="imagenEdicion" :src="imagenEdicion" alt="Foto" class="rounded-xl w-full" />
      <Message severity="warn" v-if="mostrarAdvertencia">Ya existe un producto con ese nombre</Message>
      <div v-if="esNuevo" class="flex flex-col gap-3">
        <b>Ubicación</b>
        <FloatLabel variant="on">
          <Select v-model="galponSeleccionado" :options="globalStore.Galpones" optionLabel="nombre" optionValue="id" showClear class="w-full" />
          <label>Galpón</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <Select v-model="estanteSeleccionado" :options="galponSeleccionado?.estantes" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!galponSeleccionado" />
          <label>Estante</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <Select v-model="nivelSeleccionado" :options="estanteSeleccionado?.niveles" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!estanteSeleccionado" />
          <label>Nivel</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <Select v-model="seccionSeleccionada" :options="nivelSeleccionado?.secciones" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!nivelSeleccionado" />
          <label>Sección</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <Select v-model="cajaSeleccionada" :options="seccionSeleccionada?.cajas" optionLabel="nombre" optionValue="id" showClear class="w-full" :disabled="!seccionSeleccionada" />
          <label>Caja</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputNumber v-model="cantidadInicial" :minFractionDigits="0" :maxFractionDigits="0" :min="1" class="w-full" :disabled="!cajaSeleccionada" />
          <label>Cantidad</label>
        </FloatLabel>
      </div>
    </div>
  </DialogoEdicion>

  <!-- Dialogo para importar productos -->
  <Dialog v-model:visible="dialogoImportar" header="Importar Productos" modal :closable="permitirCerrarDialogoImportar" :style="{ width: '450px' }">
    <div class="flex flex-col gap-3">
      <p>Seleccione el archivo CSV con los productos.</p>
      <FileUpload
        ref="fileupload"
        mode="basic"
        accept=".csv"
        :maxFileSize="1048576"
        class="p-button-outlined"
        custom-upload
        @select="() => deshabilitarBotonImportar = false"
        choose-label="xx"
        @uploader="ImportarProductos" />
      <Button label="Importar" icon="pi pi-file-import" severity="primary" variant="outlined" :disabled="deshabilitarBotonImportar" @click="fileupload?.upload()" />
      <ProgressBar :value="Math.ceil((progresoImportacion / totalRegistros) * 100)">{{ `${progresoImportacion}/${totalRegistros}` }}</ProgressBar>
      <Message severity="success" v-show="mostrarMensajeImportacion">Los productos se han importado correctamente.</Message>
      <Message severity="error" v-show="errorImportacion">{{ errorImportacion }}</Message>
    </div>
  </Dialog>

  <!-- Diálogo para agregar Grupos o Fabricantes -->
  <DialogoEdicion v-model:mostrar="agregandoLista" :esAgregar="true" :clickAceptar="GuardarLista" :nombre-objeto="listaEdicion.tipo"
    :desabilitarAceptar="listaEdicion.nombre.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Nombre</label>
      <InputText id="nombre" v-model="listaEdicion.nombre" autofocus class="w-full" :invalid="!listaEdicion?.nombre"  @keyup.enter="Guardar" />
    </FloatLabel>
  </DialogoEdicion>
</template>
