<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Cantidades, CantidadesConProducto, Inventario, Lista, Producto, TipoInventario } from '@/servicios/modelos.ts';
import { onMounted, ref, watchEffect, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import * as StorageService from '@/servicios/StorageService.ts';
import { Usuario } from '@/servicios/appwrite';

const router = useRouter();
const confirm = useConfirm();

const estanteQueryString = (router.currentRoute.value.params.estante as string).split('-');
const estante = ref<Inventario>({ $id: estanteQueryString[0] ?? '', tipo: 'Estante', padre: estanteQueryString[1] ?? '', nombre: estanteQueryString[2] ?? '', ordenDescendente: estanteQueryString[3] === 'true' });
const galponNombre = estanteQueryString[4] ?? '';
const galponOrdenDescendente = estanteQueryString[5];

const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', tipo: 'Sección', nombre: '', padre: estante.value.nombre, ordenDescendente: false });
const esNuevo = ref(false);

const mostrarDialogoProducto = ref(false);
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string>('');
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);
const cantidad = ref<number>(1);
const cajaSeleccionada = ref<Inventario | null>(null);
const productosEnCaja = ref<CantidadesConProducto[]>([]);
const productosEnCajas = ref<CantidadesConProducto[]>([]);
const mostrarDialogoCaja = ref(false);
const gruposDict = ref<Record<string, string>>({});
const fabricantesDict = ref<Record<string, string>>({});

const deshabilitarSiguienteCaja = ref(false);
const deshabilitarCajaAnterior = ref(false);

const mostrarDialogoMover = ref(false);
const elementoAMover = ref<Inventario | null>(null);
const nuevoPadreNivel = ref<Inventario | null>(null);
const nuevoPadreSeccion = ref<Inventario | null>(null);

const seccionesNivel = computed(() => {
  if (nuevoPadreNivel.value == null || elementoAMover.value == null)
    return [];
  return TablesDbService.Inventarios.value.filter(x => x.padre == nuevoPadreNivel.value?.$id && x.$id !== elementoAMover.value?.padre);
})

onMounted(async () => {
  grupos.value = TablesDbService.ObtenerLista('grupos');
  gruposDict.value = Object.fromEntries(grupos.value.map(x => [x.$id, x.nombre]));
  const fabricantes = TablesDbService.ObtenerLista('fabricantes');
  fabricantesDict.value = Object.fromEntries(fabricantes.map(x => [x.$id, x.nombre]));
  productosEnCajas.value = await TablesDbService.ObtenerCantidadesConProductos();
})

watchEffect(async () => {
  if (grupoSeleccionado.value) {
    productosDelGrupo.value = (await TablesDbService.ObtenerProductosPorGrupo(grupoSeleccionado.value)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
});

const productosNombresEnCaja = computed(() => {
  return productosEnCajas.value.reduce((dict, cantidad) => {
    dict[cantidad.cajon] = dict[cantidad.cajon] ? `${dict[cantidad.cajon]}\n• ${cantidad.producto.nombre} (${cantidad.cantidad})` : `• ${cantidad.producto.nombre} (${cantidad.cantidad})`;
    return dict;
  }, {} as Record<string, string>);
});

function Agregar(padre: string, tipoEdicion: TipoInventario) {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', nombre: '', tipo: tipoEdicion, padre: padre, ordenDescendente: false };
  dialogVisible.value = true;
}

function Editar(item: Inventario) {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('inventario', itemEdicion.value);
    TablesDbService.Inventarios.value.push({ ...itemEdicion.value });
  } else {
    const indice = TablesDbService.Inventarios.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('inventario', itemEdicion.value);
      TablesDbService.Inventarios.value[indice] = { ...itemEdicion.value };
    }
    if (itemEdicion.value.$id === estante.value.$id) {
      estante.value.nombre = itemEdicion.value.nombre;
      estante.value.ordenDescendente = itemEdicion.value.ordenDescendente;
    }
  }
  dialogVisible.value = false;
}

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar ${item.tipo}: "${item.nombre}" y sus descendientes?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => await TablesDbService.EliminarItemInventario(item)
  });
}

function AgregarProductoACaja(caja: Inventario) {
  mostrarDialogoProducto.value = true;
  productoSeleccionado.value = null;
  cantidad.value = 1;
  cajaSeleccionada.value = caja;
}

async function GuardarProducto() {
  if (productoSeleccionado.value == null || cajaSeleccionada.value == null || cantidad.value <= 0)
    return;
  const item: Cantidades = {
    $id: '',
    producto: productoSeleccionado.value.$id,
    cantidad: cantidad.value,
    cajon: cajaSeleccionada.value.$id
  };
  await TablesDbService.Crear('cantidades', item);
  productosEnCajas.value.push({ ...item, producto: productoSeleccionado.value });
  mostrarDialogoProducto.value = false;
}

async function VerCaja(caja: Inventario) {
  productosEnCaja.value = productosEnCajas.value.filter(x => x.cajon === caja.$id);
  cajaSeleccionada.value = caja;
  mostrarDialogoCaja.value = true;
}

async function CajaAnterior() {
  if (cajaSeleccionada.value == null)
    return;
  if (deshabilitarSiguienteCaja.value)
    deshabilitarSiguienteCaja.value = false;

  // Revisa si hay una caja anterior en la misma sección
  const cajasEnSeccion = TablesDbService.Inventarios.value.filter(x => x.padre == cajaSeleccionada.value?.padre);
  const indiceCaja = cajasEnSeccion.indexOf(cajaSeleccionada.value);
  if (cajasEnSeccion.length > 1 && indiceCaja > 0) {
    const cajaAnterior = cajasEnSeccion[indiceCaja - 1];
    if (cajaAnterior)
      await VerCaja(cajaAnterior);
    return;
  }

  // Si no hay caja anterior en la misma sección, busca en la sección anterior del mismo nivel
  const seccionActual = TablesDbService.Inventarios.value.find(x => x.$id == cajaSeleccionada.value?.padre);
  if (!seccionActual)
    return;
  const nivelActual = TablesDbService.Inventarios.value.find(x => x.$id == seccionActual.padre);
  if (!nivelActual)
    return;

  const seccionesNivel = TablesDbService.Inventarios.value.filter(x => x.padre == nivelActual.$id).sort((a, b) => Ordenar(a, b, nivelActual.ordenDescendente));
  const indiceSeccion = seccionesNivel.indexOf(seccionActual);
  if (indiceSeccion > 0) {
    const seccionAnterior = seccionesNivel[indiceSeccion - 1];
    if (!seccionAnterior) {
      deshabilitarCajaAnterior.value = true;
      return;
    }

    const cajasSeccionAnterior = TablesDbService.Inventarios.value.filter(x => x.padre == seccionAnterior.$id);
    if (cajasSeccionAnterior.length > 0) {
      const cajaAnterior = cajasSeccionAnterior[cajasSeccionAnterior.length - 1];
      if (cajaAnterior)
        await VerCaja(cajaAnterior);
    } else {
      deshabilitarCajaAnterior.value = true;
    }
  } else {
    deshabilitarCajaAnterior.value = true;
  }
}

async function CajaSiguiente() {
  if (cajaSeleccionada.value == null)
    return;

  if (deshabilitarCajaAnterior.value)
    deshabilitarCajaAnterior.value = false;

  // Revisa si hay una caja siguiente en la misma sección
  const cajasEnSeccion = TablesDbService.Inventarios.value.filter(x => x.padre == cajaSeleccionada.value?.padre);
  const indiceCaja = cajasEnSeccion.indexOf(cajaSeleccionada.value);
  if (cajasEnSeccion.length > 1 && indiceCaja < cajasEnSeccion.length - 1) {
    const cajaSiguiente = cajasEnSeccion[indiceCaja + 1];
    if (cajaSiguiente)
      await VerCaja(cajaSiguiente);
    return;
  }

    // Si no hay caja anterior en la misma sección, busca en la sección siguiente del mismo nivel
  const seccionActual = TablesDbService.Inventarios.value.find(x => x.$id == cajaSeleccionada.value?.padre);
  if (!seccionActual)
    return;
  const nivelActual = TablesDbService.Inventarios.value.find(x => x.$id == seccionActual.padre);
  if (!nivelActual)
    return;

  const seccionesNivel = TablesDbService.Inventarios.value.filter(x => x.padre == nivelActual.$id).sort((a, b) => Ordenar(a, b, nivelActual.ordenDescendente));
  const indiceSeccion = seccionesNivel.indexOf(seccionActual);
  if (indiceSeccion < seccionesNivel.length - 1) {
    const seccionSiguiente = seccionesNivel[indiceSeccion + 1];
    if (!seccionSiguiente) {
      deshabilitarSiguienteCaja.value = true;
      return;
    }

    const cajasSeccionSiguiente = TablesDbService.Inventarios.value.filter(x => x.padre == seccionSiguiente.$id);
    if (cajasSeccionSiguiente.length > 0) {
      const cajaSiguiente = cajasSeccionSiguiente[0];
      if (cajaSiguiente)
        await VerCaja(cajaSiguiente);
    } else {
      deshabilitarSiguienteCaja.value = true;
    }
  } else {
    deshabilitarSiguienteCaja.value = true;
  }
}

function Ordenar(a: Inventario, b: Inventario, ordenDescendente: boolean): number {
  const numeroA = parseInt(a.nombre.replace(/\D/g, ''));
  const numeroB = parseInt(b.nombre.replace(/\D/g, ''));
  return ordenDescendente ? numeroB - numeroA : numeroA - numeroB;
}

function MostrarDialogoMover(elemento: Inventario) {
  mostrarDialogoMover.value = true;
  elementoAMover.value = elemento;
  nuevoPadreNivel.value = null;
  nuevoPadreSeccion.value = null;
}

async function Mover() {
  if (elementoAMover.value == null)
    return;

  if (elementoAMover.value.tipo === 'Caja' && nuevoPadreSeccion.value != null) {
    elementoAMover.value.padre = nuevoPadreSeccion.value.$id;
  } else if (elementoAMover.value.tipo === 'Sección' && nuevoPadreNivel.value != null) {
    elementoAMover.value.padre = nuevoPadreNivel.value.$id;
  } else {
    return;
  }

  const indice = TablesDbService.Inventarios.value.findIndex(x => x.$id === elementoAMover.value?.$id);
  if (indice >= 0) {
    await TablesDbService.Actualizar('inventario', elementoAMover.value);
    TablesDbService.Inventarios.value[indice] = { ...elementoAMover.value };
  }
  mostrarDialogoMover.value = false;
}
</script>

<template>
  <div id="encabezado" class="flex justify-between items-center mb-4">
    <Button :label="`Galpón ${galponNombre}`" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push(`/galpon/${estante.padre}-${galponNombre}-${galponOrdenDescendente}`)" />
    <div class="text-xl">ESTANTE {{estante.nombre}}</div>
    <div>
      <Button v-if="Usuario" label="Estante" icon="pi pi-pen-to-square" severity="success" variant="outlined" class="mr-2" @click="Editar(estante)" />
      <Button v-if="Usuario" label="Nivel" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar(estante.$id, 'Nivel')" />
    </div>
  </div>

  <div v-if="TablesDbService.Inventarios.value.filter(x => x.padre == estante.$id).length === 0" class="italic text-muted-color">
      No hay niveles en este estante. Agrega niveles.
  </div>
  <div v-else v-for="nivel in TablesDbService.Inventarios.value.filter(x => x.padre == estante.$id).sort((a, b) => Ordenar(a, b, estante.ordenDescendente))" :key="nivel.$id">
     <Fieldset :pt="{ root: 'border-2 border-gray-400 p-1 flex justify-center', legend: { style: 'margin-left: 50%' } }">
      <template #legend>
        <div class="flex items-center">
          <div class="font-medium">Nivel {{ nivel.nombre }}</div>
          <Button v-if="Usuario" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar(nivel.$id, 'Sección')"  v-tooltip.bottom="'Agregar Sección'" class="ml-2" />
          <EditarQuitar v-if="Usuario" tamaño="small" @editarClick="Editar(nivel)" @quitarClick="Quitar(nivel)" />
        </div>
      </template>
      <div class="flex flex-row gap-2">
        <div v-if="TablesDbService.Inventarios.value.filter(x => x.padre == nivel.$id).length === 0" class="italic text-muted-color">
          No hay secciones en este nivel.
        </div>
        <Panel v-else v-for="seccion in TablesDbService.Inventarios.value.filter(x => x.padre == nivel.$id).sort((a, b) => Ordenar(a, b, nivel.ordenDescendente)) "
            :key="seccion.$id" :header="seccion.nombre" :pt:header:class="Usuario ? '' : 'justify-center'" :pt:content:class="'p-0'" :pt:root:class="'min-w-25'">
          <template #icons v-if="Usuario">
            <div class="flex">
              <Button icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar(seccion.$id, 'Caja')"  v-tooltip.bottom="'Agregar Caja'" />
              <Button v-if="Usuario" icon="pi pi-arrows-alt" severity="secondary" size="small" variant="text" @click="MostrarDialogoMover(seccion)" v-tooltip.bottom="'Mover Sección'" />
              <EditarQuitar tamaño="small" @editar-click="Editar(seccion)" @quitar-click="Quitar(seccion)" />
            </div>
          </template>
          <div v-if="TablesDbService.Inventarios.value.filter(x => x.padre == seccion.$id).length === 0" class="italic text-muted-color m-1">
            No hay cajas en esta Sección.
          </div>
          <div v-else v-for="caja in TablesDbService.Inventarios.value.filter(x => x.padre == seccion.$id)" :key="caja.$id"
              class="py-1 border-1 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <div class="flex">
                <Button variant="text" severity="warn" size="small" :label="'Caja ' + caja.nombre + (productosNombresEnCaja[caja.$id] == undefined ? ' *' : '')" @click="VerCaja(caja)" class="grow" :pt="{ label: 'text-nowrap' }" v-tooltip.bottom="productosNombresEnCaja[caja.$id] ?? 'No hay productos en esta caja'" />
                <Button v-if="Usuario" icon="pi pi-file-plus" severity="info" size="small" variant="text" @click="AgregarProductoACaja(caja)" v-tooltip.bottom="'Agregar Producto'" />
                <Button v-if="Usuario" icon="pi pi-arrows-alt" severity="secondary" size="small" variant="text" @click="MostrarDialogoMover(caja)" v-tooltip.bottom="'Mover Caja'" />
                <EditarQuitar v-if="Usuario" tamaño="small" @editarClick="Editar(caja)" @quitarClick="Quitar(caja)" />
              </div>
          </div>
        </Panel>
      </div>
    </Fieldset>
  </div>

  <DialogoEdicion id="editar" v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" :nombre-objeto="itemEdicion.tipo"
    :desabilitarAceptar="itemEdicion.nombre.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full mt-1">
        <label for="nombre">{{ itemEdicion.tipo }}</label>
        <InputText id="nombre" v-model="itemEdicion.nombre" autofocus class="w-full" :invalid="!itemEdicion?.nombre" aria-autocomplete="none" @keyup.enter="Guardar" />
      </FloatLabel>
      <div v-if="itemEdicion.tipo === 'Estante' || itemEdicion.tipo === 'Nivel'" class="flex gap-2 items-center">
        <label for="ordenDescendente">Orden Descendente</label>
        <ToggleSwitch id="ordenDescendente" v-model="itemEdicion.ordenDescendente" />
      </div>
    </div>
  </DialogoEdicion>

  <DialogoEdicion id="agregarProducto" v-model:mostrar="mostrarDialogoProducto" :esAgregar="true" :clickAceptar="GuardarProducto" nombre-objeto="Producto"
    :desabilitarAceptar="productoSeleccionado == null || cantidad <= 0" class="w-sm md:w-md">
    <label for="grupo">Grupo</label>
    <Select id="grupo" v-model="grupoSeleccionado" :options="grupos" optionValue="$id" optionLabel="nombre" class="w-full mb-3" />
    <label for="productos">Productos</label>
    <Listbox id="productos" v-model="productoSeleccionado" :options="productosDelGrupo" :optionLabel="(data: Producto) => data.nombre + ' - ' + (data.codigo ?? '')" class="w-full" />
    <div class="mt-3 flex gap-3 items-center">
      <label for="cantidad">Cantidad</label>
      <InputNumber id="cantidad" v-model="cantidad" :min="1" class="w-full" />
    </div>
  </DialogoEdicion>

  <Dialog v-model:visible="mostrarDialogoCaja" :modal="true" class="md:w-2xl">
    <template #header>
      <div class="flex justify-center items-center w-full">
        <Button icon="pi pi-arrow-left" severity="secondary" variant="text"  v-tooltip.bottom="'Anterior'" @click="CajaAnterior" :disabled="deshabilitarCajaAnterior" />
        <div class="mx-2 text-xl font-medium">Caja {{ cajaSeleccionada?.nombre }}</div>
        <Button icon="pi pi-arrow-right" severity="secondary" variant="text" v-tooltip.bottom="'Siguiente'" @click="CajaSiguiente" :disabled="deshabilitarSiguienteCaja" />
      </div>
    </template>
    <div v-if="productosEnCaja.length === 0" class="italic text-muted-color">No hay productos en esta caja</div>
    <div v-else v-for="item in productosEnCaja" :key="item.$id" class="p-2 border-2 rounded-md border-gray bg-yellow-50 dark:bg-yellow-900 mb-2">
      <div class="flex justify-between">
        <div>
          <div><b>Nombre: </b>{{ item.producto.nombre }}</div>
          <div><b>Grupo: </b>{{ gruposDict[item.producto.grupo] }}</div>
          <div><b>Fabricante: </b>{{ fabricantesDict[item.producto.fabricante] }}</div>
          <div><b>Código: </b>{{ item.producto.codigo }}</div>
          <br />
          <div><b>Cantidad: </b>{{ item.cantidad }}</div>
          <div><b>Peso Unitario: </b>{{ item.producto.pesoUnitario }} Kg.</div>
          <div><b>Peso Total: </b>{{ (item.producto.pesoUnitario * item.cantidad).toFixed(2) }} Kg.</div>
        </div>
        <img :src="item.producto.imagenId ? StorageService.Url(item.producto.imagenId ?? '') : undefined" alt="Foto" class="rounded-xl w-49 h-49" />
      </div>
      <div><b>Descripción: </b>{{ item.producto.descripcion }}</div>
    </div>
  </Dialog>

  <DialogoEdicion id="mover" v-model:mostrar="mostrarDialogoMover" :encabezado="'Mover ' + elementoAMover?.tipo + ' ' + elementoAMover?.nombre"
    :clickAceptar="Mover" :desabilitarAceptar="elementoAMover?.tipo === 'Caja' ? nuevoPadreSeccion == null : nuevoPadreNivel == null">
    <div class="flex flex-col gap-2">
      <div class="flex gap-2 items-center">
        <label for="nuevoPadreNivel">Nuevo Nivel: </label>
        <Select id="nuevoPadreNivel" v-model="nuevoPadreNivel" option-label="nombre"
          :options="TablesDbService.Inventarios.value.filter(x => x.padre == estante?.$id && x.$id !== elementoAMover?.padre)">
        </Select>
      </div>
      <div class="flex gap-2 items-center" v-if="elementoAMover?.tipo === 'Caja'">
        <label for="nuevoPadreSeccion">Nueva Sección: </label>
        <Select id="nuevoPadreSeccion" v-model="nuevoPadreSeccion" option-label="nombre" :options="seccionesNivel" />
      </div>
    </div>
  </DialogoEdicion>
</template>
