<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Caja, CantidadesConProducto, ItemOrdenable, Lista, Nivel, Producto, Seccion } from '@/servicios/modelos.ts';
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import BotonesCompacto from '@/componentes/BotonesCompacto.vue';
import { useGlobalStore } from '@/servicios/globalStore';
import { useAuthStore } from '@/servicios/authStore';
import { RegistrarHistorial } from '@/servicios/historialService';
import type { FileUploadSelectEvent } from 'primevue';
import { Subir } from '@/servicios/StorageService';

const router = useRouter();
const confirm = useConfirm();
const Usuario = useAuthStore().Usuario;
const globalStore = useGlobalStore();

type TipoEdicion = 'Estante' | 'Nivel' | 'Seccion' | 'Caja';
const tipoEdicion = ref<TipoEdicion>('Nivel');
const dialogVisible = ref(false);
const itemEdicion = ref<ItemOrdenable>({ id: '', nombre: '', ordenDescendente: false });
const nombreAnteriorEdicion = ref('');
const esNuevo = ref(false);
const nivelParaNuevoItem = ref<Nivel | null>(null);
const seccionParaNuevoItem = ref<Seccion | null>(null);

const grupos = ref<Lista[]>([]);
const productosEnCajas = ref<CantidadesConProducto[]>([]);
const mostrarDialogoCaja = ref(false);
const deshabilitarSiguienteCaja = ref(false);
const deshabilitarCajaAnterior = ref(false);

const mostrarDialogoMover = ref(false);
const elementoAMover = ref<{ id: string; nombre: string; tipo: 'Caja' | 'Seccion'; padreActualId: string } | null>(null);
const nuevoPadreNivel = ref<Nivel | null>(null);
const nuevoPadreSeccion = ref<Seccion | null>(null);

const imagenEdicion = ref<string>();
const productoEditando = ref<Producto | null>(null);
let archivoFoto: File | undefined;
const estados = globalStore.ObtenerLista('estados').map(x => ({ id: x.id, nombre: x.nombre.substring(3), tipo: x.tipo }));

const seccionesNivel = computed(() => {
  if (!nuevoPadreNivel.value || !elementoAMover.value) return [];
  return nuevoPadreNivel.value.secciones.filter(s => s.id !== elementoAMover.value!.padreActualId);
});

onMounted(() => {
  grupos.value = globalStore.ObtenerLista('grupos');
  productosEnCajas.value = globalStore.ObtenerCantidadesConProductos();
});

const productosNombresEnCaja = computed(() => {
  return productosEnCajas.value.reduce((dict, cantidad) => {
    dict[cantidad.cajaId] = dict[cantidad.cajaId]
      ? `${dict[cantidad.cajaId]}\n• ${cantidad.producto.nombre} (${cantidad.cantidad})`
      : `• ${cantidad.producto.nombre} (${cantidad.cantidad})`;
    return dict;
  }, {} as Record<string, string>);
});

// Busca el nivel y sección que contienen una caja por ID
function encontrarPadresDeCaja(cajaId: string): { nivel: Nivel; seccion: Seccion } | null {
  for (const nivel of globalStore.EstanteSeleccionado!.niveles) {
    for (const seccion of nivel.secciones) {
      if (seccion.cajas.some(c => c.id === cajaId)) return { nivel, seccion };
    }
  }
  return null;
}

// Busca el nivel que contiene una sección por ID
function encontrarNivelDeSeccion(seccionId: string): Nivel | null {
  return globalStore.EstanteSeleccionado!.niveles.find(n => n.secciones.some(s => s.id === seccionId)) ?? null;
}

function Agregar(tipo: TipoEdicion, nivel?: Nivel, seccion?: Seccion) {
  esNuevo.value = true;
  tipoEdicion.value = tipo;
  nivelParaNuevoItem.value = nivel ?? null;
  seccionParaNuevoItem.value = seccion ?? null;
  itemEdicion.value = { id: crypto.randomUUID(), nombre: tipo === 'Seccion' ? globalStore.EstanteSeleccionado!.nombre : '', ordenDescendente: false };
  dialogVisible.value = true;
}

function Editar(item: { id: string; nombre: string; ordenDescendente?: boolean }, tipo: TipoEdicion) {
  esNuevo.value = false;
  tipoEdicion.value = tipo;
  nombreAnteriorEdicion.value = item.nombre;
  itemEdicion.value = { id: item.id, nombre: item.nombre, ordenDescendente: item.ordenDescendente ?? false };
  dialogVisible.value = true;
}

async function Guardar() {
  const galpon = globalStore.GalponSeleccionado!;
  const estante = globalStore.EstanteSeleccionado!;

  if (esNuevo.value) {
    if (tipoEdicion.value === 'Nivel') {
      const nuevoNivel: Nivel = { id: itemEdicion.value.id, nombre: itemEdicion.value.nombre, ordenDescendente: itemEdicion.value.ordenDescendente, secciones: [] };
      estante.niveles.push(nuevoNivel);
    } else if (tipoEdicion.value === 'Seccion' && nivelParaNuevoItem.value) {
      const nuevaSeccion: Seccion = { id: itemEdicion.value.id, nombre: itemEdicion.value.nombre, cajas: [] };
      // Crear automáticamente una caja con el número de la sección
      const cajaNombre = itemEdicion.value.nombre.replace(/\D/g, '');
      nuevaSeccion.cajas.push({ id: crypto.randomUUID(), nombre: cajaNombre });
      nivelParaNuevoItem.value.secciones.push(nuevaSeccion);
    } else if (tipoEdicion.value === 'Caja' && seccionParaNuevoItem.value) {
      const nuevaCaja: Caja = { id: itemEdicion.value.id, nombre: itemEdicion.value.nombre };
      seccionParaNuevoItem.value.cajas.push(nuevaCaja);
    }
    await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, galpon);
    await RegistrarHistorial(itemEdicion.value.id, `[${tipoEdicion.value}] Creado`, null, itemEdicion.value.nombre);
  } else {
    if (tipoEdicion.value === 'Estante') {
      estante.nombre = itemEdicion.value.nombre;
      estante.ordenDescendente = itemEdicion.value.ordenDescendente;
    } else if (tipoEdicion.value === 'Nivel') {
      const nivel = estante.niveles.find(n => n.id === itemEdicion.value.id);
      if (nivel) { nivel.nombre = itemEdicion.value.nombre; nivel.ordenDescendente = itemEdicion.value.ordenDescendente; }
    } else if (tipoEdicion.value === 'Seccion') {
      for (const nivel of estante.niveles) {
        const seccion = nivel.secciones.find(s => s.id === itemEdicion.value.id);
        if (seccion) { seccion.nombre = itemEdicion.value.nombre; break; }
      }
    } else if (tipoEdicion.value === 'Caja') {
      for (const nivel of estante.niveles) {
        for (const seccion of nivel.secciones) {
          const caja = seccion.cajas.find(c => c.id === itemEdicion.value.id);
          if (caja) { caja.nombre = itemEdicion.value.nombre; break; }
        }
      }
    }
    await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, galpon);
    await RegistrarHistorial(itemEdicion.value.id, `[${tipoEdicion.value}] Modificado`, nombreAnteriorEdicion.value, itemEdicion.value.nombre);
  }
  dialogVisible.value = false;
}

function Quitar(item: { id: string; nombre: string }, tipo: TipoEdicion, nivel?: Nivel, seccion?: Seccion): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar ${tipo}: "${item.nombre}" y sus descendientes?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      await RegistrarHistorial(item.id, `[${tipo}] Eliminado`, item.nombre, null);
      const estante = globalStore.EstanteSeleccionado!;
      if (tipo === 'Nivel') {
        estante.niveles = estante.niveles.filter(n => n.id !== item.id);
      } else if (tipo === 'Seccion' && nivel) {
        nivel.secciones = nivel.secciones.filter(s => s.id !== item.id);
      } else if (tipo === 'Caja' && seccion) {
        seccion.cajas = seccion.cajas.filter(c => c.id !== item.id);
      }
      await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, globalStore.GalponSeleccionado!);
    }
  });
}

async function VerCaja(caja: Caja) {
  globalStore.ProductosEnCaja = productosEnCajas.value.filter(x => x.cajaId === caja.id);
  globalStore.CajaSeleccionada = caja;
  mostrarDialogoCaja.value = true;
  deshabilitarSiguienteCaja.value = false;
  deshabilitarCajaAnterior.value = false;
}

async function CajaAnterior() {
  if (!globalStore.CajaSeleccionada) return;
  if (deshabilitarSiguienteCaja.value) deshabilitarSiguienteCaja.value = false;

  const padres = encontrarPadresDeCaja(globalStore.CajaSeleccionada.id);
  if (!padres) return;
  const { nivel, seccion } = padres;

  const indiceCaja = seccion.cajas.findIndex(c => c.id === globalStore.CajaSeleccionada!.id);
  if (indiceCaja > 0) {
    await VerCaja(seccion.cajas[indiceCaja - 1]!);
    return;
  }

  const seccionesOrdenadas = [...nivel.secciones].sort((a, b) => Ordenar(a, b, nivel.ordenDescendente));
  const indiceSeccion = seccionesOrdenadas.findIndex(s => s.id === seccion.id);
  if (indiceSeccion > 0) {
    const seccionAnterior = seccionesOrdenadas[indiceSeccion - 1]!;
    if (seccionAnterior.cajas.length > 0) {
      await VerCaja(seccionAnterior.cajas[seccionAnterior.cajas.length - 1]!);
    } else {
      deshabilitarCajaAnterior.value = true;
    }
  } else {
    deshabilitarCajaAnterior.value = true;
  }
}

async function CajaSiguiente() {
  if (!globalStore.CajaSeleccionada) return;
  if (deshabilitarCajaAnterior.value) deshabilitarCajaAnterior.value = false;

  const padres = encontrarPadresDeCaja(globalStore.CajaSeleccionada.id);
  if (!padres) return;
  const { nivel, seccion } = padres;

  const indiceCaja = seccion.cajas.findIndex(c => c.id === globalStore.CajaSeleccionada!.id);
  if (indiceCaja < seccion.cajas.length - 1) {
    await VerCaja(seccion.cajas[indiceCaja + 1]!);
    return;
  }

  const seccionesOrdenadas = [...nivel.secciones].sort((a, b) => Ordenar(a, b, nivel.ordenDescendente));
  const indiceSeccion = seccionesOrdenadas.findIndex(s => s.id === seccion.id);
  if (indiceSeccion < seccionesOrdenadas.length - 1) {
    const seccionSiguiente = seccionesOrdenadas[indiceSeccion + 1]!;
    if (seccionSiguiente.cajas.length > 0) {
      await VerCaja(seccionSiguiente.cajas[0]!);
    } else {
      deshabilitarSiguienteCaja.value = true;
    }
  } else {
    deshabilitarSiguienteCaja.value = true;
  }
}

function Ordenar(a: { nombre: string }, b: { nombre: string }, ordenDescendente: boolean): number {
  const numeroA = parseInt(a.nombre.replace(/\D/g, ''));
  const numeroB = parseInt(b.nombre.replace(/\D/g, ''));
  return ordenDescendente ? numeroB - numeroA : numeroA - numeroB;
}

function MostrarDialogoMover(item: { id: string; nombre: string }, tipo: 'Caja' | 'Seccion') {
  const padreActualId = tipo === 'Caja'
    ? (encontrarPadresDeCaja(item.id)?.seccion.id ?? '')
    : (encontrarNivelDeSeccion(item.id)?.id ?? '');
  elementoAMover.value = { ...item, tipo, padreActualId };
  nuevoPadreNivel.value = null;
  nuevoPadreSeccion.value = null;
  mostrarDialogoMover.value = true;
}

async function Mover() {
  if (!elementoAMover.value) return;
  const galpon = globalStore.GalponSeleccionado!;

  if (elementoAMover.value.tipo === 'Caja' && nuevoPadreSeccion.value) {
    const padres = encontrarPadresDeCaja(elementoAMover.value.id);
    if (!padres) return;
    const caja = padres.seccion.cajas.find(c => c.id === elementoAMover.value!.id)!;
    padres.seccion.cajas = padres.seccion.cajas.filter(c => c.id !== caja.id);
    nuevoPadreSeccion.value.cajas.push(caja);
    await RegistrarHistorial(caja.id, '[Caja] Movida', `De sección: ${padres.seccion.nombre}`, `A sección: ${nuevoPadreSeccion.value.nombre}`);
  } else if (elementoAMover.value.tipo === 'Seccion' && nuevoPadreNivel.value) {
    const nivelActual = encontrarNivelDeSeccion(elementoAMover.value.id);
    if (!nivelActual) return;
    const seccion = nivelActual.secciones.find(s => s.id === elementoAMover.value!.id)!;
    nivelActual.secciones = nivelActual.secciones.filter(s => s.id !== seccion.id);
    nuevoPadreNivel.value.secciones.push(seccion);
    await RegistrarHistorial(seccion.id, '[Sección] Movida', `De nivel: ${nivelActual.nombre}`, `A nivel: ${nuevoPadreNivel.value.nombre}`);
  } else {
    return;
  }

  await TablesDbService.Actualizar(TablesDbService.Coleccion.Galpones, galpon);
  mostrarDialogoMover.value = false;
}

function ImprimirCaja(caja: Caja) {
  globalStore.CajaSeleccionada = caja;
  router.push('/imprimir/caja');
}

function EditarProducto(producto: Producto) {
  productoEditando.value = producto;
  imagenEdicion.value = producto.imagenUrl ?? undefined;
  deshabilitarCajaAnterior.value = true;
  deshabilitarSiguienteCaja.value = true;
}
function CancelarEdicionProducto() {
  productoEditando.value = null;
  imagenEdicion.value = undefined;
  deshabilitarCajaAnterior.value = false;
  deshabilitarSiguienteCaja.value = false;
}
async function GuardarEdicionProducto(cantidadProducto: CantidadesConProducto) {
  if (!productoEditando.value) return;
  try {
    const anterior = globalStore.Productos.find(p => p.id === productoEditando.value!.id);
    if (anterior) {

      if (archivoFoto) {
        productoEditando.value.imagenUrl = await Subir(archivoFoto);
        archivoFoto = undefined;
      }

      const anteriorJson = JSON.stringify(anterior);
      await TablesDbService.Actualizar(TablesDbService.Coleccion.Productos, productoEditando.value);
      const posteriorJson = JSON.stringify(productoEditando.value);
      await RegistrarHistorial(productoEditando.value.id, '[Producto] Modificado', anteriorJson, posteriorJson);
      const indice = globalStore.Productos.indexOf(anterior);
      globalStore.Productos[indice] = { ...productoEditando.value };
      cantidadProducto.producto = { ...productoEditando.value };
    }
  } catch (error) {
    console.error('Error al guardar el producto:', error);
  }
  CancelarEdicionProducto();
}
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
</script>

<template>
  <div id="encabezado" class="flex justify-between md:grid md:grid-cols-3 items-center mb-3">
    <Button class="justify-self-start" severity="secondary" variant="outlined" @click="() => router.push('/galpon')">
      <span class="p-button-icon p-button-icon-left pi pi-arrow-left" />
      <span class="p-button-label hidden md:inline">Galpón {{globalStore.GalponSeleccionado!.nombre}}</span>
    </Button>
    <div class="justify-self-center text-xl">ESTANTE {{globalStore.EstanteSeleccionado!.nombre}}</div>
    <div class="justify-self-end">
      <Button v-if="Usuario" severity="primary" variant="outlined" class="mr-2" @click="router.push('/imprimir/secciones')">
        <span class="p-button-icon p-button-icon-left pi pi-print" />
        <span class="p-button-label hidden md:inline">Sección</span>
      </Button>
      <Button v-if="Usuario" severity="primary" variant="outlined" class="mr-2" @click="router.push('/imprimir/gruposEstante')">
        <span class="p-button-icon p-button-icon-left pi pi-print" />
        <span class="p-button-label hidden md:inline">Grupo</span>
      </Button>
      <Button v-if="Usuario" icon="pi pi-pen-to-square" label="Estante" severity="success" variant="outlined" class="mr-2" @click="Editar(globalStore.EstanteSeleccionado!, 'Estante')">
        <span class="p-button-icon p-button-icon-left pi pi-pen-to-square" />
        <span class="p-button-label hidden md:inline">Estante</span>
      </Button>
      <Button v-if="Usuario" severity="info" variant="outlined" @click="Agregar('Nivel')">
        <span class="p-button-icon p-button-icon-left pi pi-plus" />
        <span class="p-button-label hidden md:inline">Nivel</span>
      </Button>
    </div>
  </div>

  <div v-if="globalStore.EstanteSeleccionado!.niveles.length === 0" class="italic text-muted-color">
      No hay niveles en este Estante.
  </div>
  <div v-else v-for="nivel in [...globalStore.EstanteSeleccionado!.niveles].sort((a, b) => Ordenar(a, b, globalStore.EstanteSeleccionado!.ordenDescendente))" :key="nivel.id">
     <Fieldset :pt="{ root: 'border-2 border-gray-400 p-1' }">
      <template #legend>
        <div class="flex items-center">
          <div class="font-medium">Nivel {{ nivel.nombre }}</div>
          <Button v-if="Usuario" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar('Seccion', nivel)" v-tooltip.bottom="'Agregar Sección'" class="ml-2" />
          <EditarQuitar tamaño="small" @editarClick="Editar(nivel, 'Nivel')" @quitarClick="Quitar(nivel, 'Nivel')" :id-elemento="nivel.id" :nombre-elemento="'Nivel ' + nivel.nombre" />
        </div>
      </template>
      <div class="flex flex-wrap md:flex-nowrap gap-2 justify-center" :class="{ 'gap-3': Usuario == null }">
        <div v-if="nivel.secciones.length === 0" class="italic text-muted-color">
          No hay secciones en este Nivel.
        </div>
        <Panel v-else v-for="seccion in [...nivel.secciones].sort((a, b) => Ordenar(a, b, nivel.ordenDescendente))"
            :key="seccion.id" :header="seccion.nombre" :pt:header:class="Usuario ? '' : 'justify-center'" :pt:content:class="'p-0'">
          <template #icons v-if="Usuario">
            <BotonesCompacto @agregarClick="Agregar('Caja', undefined, seccion)" @moverClick="MostrarDialogoMover(seccion, 'Seccion')" @editarClick="Editar(seccion, 'Seccion')" @quitarClick="Quitar(seccion, 'Seccion', nivel)" :id-elemento="seccion.id" :nombre-elemento="'Sección ' + seccion.nombre" button-severity="secondary" queAgregar="Caja" />
          </template>
          <div v-if="seccion.cajas.length === 0" class="italic text-muted-color m-1">
            No hay cajas en esta Sección.
          </div>
          <div v-else v-for="caja in seccion.cajas" :key="caja.id"
              class="flex justify-center py-1 border-1 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800" :class="{ 'px-2': Usuario == null }">
              <Button variant="text" severity="warn" :label="'Caja ' + caja.nombre + (productosNombresEnCaja[caja.id] == undefined ? '*' : '')" @click="VerCaja(caja)" :pt="{ label: 'text-nowrap', root: 'px-1' }"
                v-tooltip.bottom="{ value: productosNombresEnCaja[caja.id] ?? 'Caja vacía', pt: { root: 'min-w-auto max-w-md' } }" />
              <BotonesCompacto v-if="Usuario" @moverClick="MostrarDialogoMover(caja, 'Caja')" @editarClick="Editar(caja, 'Caja')" @quitarClick="Quitar(caja, 'Caja', undefined, seccion)" @imprimir-click="ImprimirCaja(caja)" :id-elemento="caja.id" :nombre-elemento="'Caja ' + caja.nombre" button-severity="warn" />
          </div>
        </Panel>
      </div>
    </Fieldset>
  </div>

  <DialogoEdicion id="editar" v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" :nombre-objeto="tipoEdicion"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full mt-1">
        <label for="nombre">{{ tipoEdicion }}</label>
        <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" aria-autocomplete="none" @keyup.enter="Guardar" />
      </FloatLabel>
      <div v-if="tipoEdicion === 'Estante' || tipoEdicion === 'Nivel'" class="flex gap-2 items-center">
        <label for="ordenDescendente">Orden Descendente</label>
        <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
      </div>
    </div>
  </DialogoEdicion>

  <Dialog v-model:visible="mostrarDialogoCaja" :modal="true" class="md:w-2xl">
    <template #header>
      <div class="grid grid-cols-3 w-full">
        <div />
        <div class="flex items-center justify-self-center">
          <Button icon="pi pi-arrow-left" severity="secondary" variant="text" v-tooltip.bottom="'Anterior'" @click="CajaAnterior" :disabled="deshabilitarCajaAnterior" />
          <div class="mx-2 text-xl font-medium">Caja {{ globalStore.CajaSeleccionada?.nombre }}</div>
          <Button icon="pi pi-arrow-right" severity="secondary" variant="text" v-tooltip.bottom="'Siguiente'" @click="CajaSiguiente" :disabled="deshabilitarSiguienteCaja" />
        </div>
        <Button v-if="Usuario" class="mr-4 justify-self-end" icon="pi pi-print" severity="secondary" variant="text" v-tooltip.bottom="'Vista Impresion'" @click="router.push('/imprimir/caja')" />
      </div>
    </template>
    <div v-if="globalStore.ProductosEnCaja.length === 0" class="italic text-muted-color">No hay productos en esta caja</div>
    <div v-else v-for="item in globalStore.ProductosEnCaja" :key="item.id" class="p-2 border-2 rounded-xl border-gray bg-yellow-50 dark:bg-yellow-900 mb-2">
      <div class="flex gap-2">
        <div>
          <img v-if="productoEditando" :src="imagenEdicion" alt="Foto" class="rounded-xl md:w-50 md:h-50" />
          <img v-else :hidden="!item.producto.imagenUrl" :src="item.producto.imagenUrl ? item.producto.imagenUrl : undefined" alt="Foto" class="rounded-xl md:w-50 md:h-50" />
          <FileUpload
            v-if="productoEditando == item.producto"
            mode="basic"
            accept="image/*"
            :maxFileSize="524288"
            choose-label="IMAGEN"
            :custom-upload="true"
            class="p-button-outlined mt-2"
            @select="SeleccionarFoto">
            <template #filelabel>&nbsp;</template>
        </FileUpload>
        </div>
        <div class="flex-1 flex flex-col gap-1">
          <div class="text-wrap flex items-center gap-2">
            <b>Nombre:</b>
            <span v-if="productoEditando != item.producto">{{ item.producto.nombre }}</span>
            <InputText v-else v-model="productoEditando!.nombre" class="flex-1" />
          </div>
          <div class="flex items-center gap-2">
            <b>Grupo:</b>
            <span v-if="productoEditando != item.producto">{{ item.producto.grupoId ? globalStore.ListasMap[item.producto.grupoId] : ''}}</span>
            <Select class="flex-1" v-else v-model="productoEditando!.grupoId" :options="grupos" optionValue="id" optionLabel="nombre" />
          </div>
          <div class="flex items-center gap-2">
            <b>Fabricante: </b>
            <span v-if="productoEditando != item.producto">{{ item.producto.fabricanteId ? globalStore.ListasMap[item.producto.fabricanteId] : ''}}</span>
            <Select v-else v-model="productoEditando!.fabricanteId" :options="globalStore.ObtenerLista('fabricantes')" optionValue="id" optionLabel="nombre" class="flex-1" />
          </div>
          <div class="flex items-center gap-2">
            <b>Código: </b>
            <span v-if="productoEditando != item.producto">{{ item.producto.codigo }}</span>
            <InputText v-else v-model="productoEditando!.codigo" class="flex-1" />
          </div>

          <div class="mt-3">
            <b>Cantidad: </b>
            <span>{{ item.cantidad.toLocaleString('es-VE') }}</span>
            <i v-if="productoEditando == item.producto" class="pi pi-info-circle ml-2 text-primary" v-tooltip.bottom="'La cantida puede modificarse en la página: Movimientos'" />
          </div>
          <div class="flex items-center gap-2">
            <b>Peso Unitario:</b>
            <span v-if="productoEditando != item.producto">{{ item.producto.pesoUnitario.toLocaleString('es-VE', { maximumFractionDigits: 2 }) }} Kg.</span>
            <InputNumber v-else v-model="productoEditando!.pesoUnitario" mode="decimal" :minFractionDigits="0" :maxFractionDigits="2" class="flex-1" />
          </div>
          <div>
            <b>Peso Total: </b>
            <span>{{ (item.producto.pesoUnitario * item.cantidad).toLocaleString('es-VE', { maximumFractionDigits: 2 }) }} Kg.</span>
          </div>
          <div class="flex items-center gap-2">
            <b>Estado: </b>
            <span v-if="productoEditando != item.producto">{{ item.producto.estadoId ? globalStore.ListasMap[item.producto.estadoId] : '' }}</span>
            <Select v-else v-model="productoEditando!.estadoId" :options="estados" optionValue="id" optionLabel="nombre" class="flex-1" />
          </div>
        </div>
      </div>
      <div class="mt-1 pl-2 flex items-center">
        <div class="flex-1 flex items-center gap-2">
          <b>Descripción:</b>
          <span v-if="productoEditando != item.producto">{{ item.producto.descripcion }}</span>
          <InputText v-else v-model="productoEditando!.descripcion" class="flex-1" />
        </div>
        <div v-if="Usuario" class="flex-none ml-2">
          <Button v-if="productoEditando != item.producto" label="Editar" icon="pi pi-pen-to-square" severity="success" variant="outlined" @click="EditarProducto(item.producto)" />
          <Button v-if="productoEditando == item.producto" icon="pi pi-times-circle" severity="danger" variant="outlined" @click="CancelarEdicionProducto" v-tooltip.bottom="'Cancelar'" />
          <Button v-if="productoEditando == item.producto" icon="pi pi-save" severity="primary" variant="outlined" @click="GuardarEdicionProducto(item)" v-tooltip.bottom="'Guardar'" class="ml-2" />
        </div>
      </div>
    </div>
  </Dialog>

  <DialogoEdicion id="mover" v-model:mostrar="mostrarDialogoMover" :encabezado="'Mover ' + elementoAMover?.tipo + ' ' + elementoAMover?.nombre"
    :clickAceptar="Mover" :desabilitarAceptar="elementoAMover?.tipo === 'Caja' ? nuevoPadreSeccion == null : nuevoPadreNivel == null">
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 items-center">
        <label for="nuevoPadreNivel">Nuevo Nivel: </label>
        <Select id="nuevoPadreNivel" v-model="nuevoPadreNivel" option-label="nombre"
          :options="globalStore.EstanteSeleccionado!.niveles.filter(n => n.id !== elementoAMover?.padreActualId)">
        </Select>
      </div>
      <div class="flex gap-2 items-center" v-if="elementoAMover?.tipo === 'Caja'">
        <label for="nuevoPadreSeccion">Nueva Sección: </label>
        <Select id="nuevoPadreSeccion" v-model="nuevoPadreSeccion" option-label="nombre" :options="seccionesNivel" />
      </div>
    </div>
  </DialogoEdicion>
</template>
