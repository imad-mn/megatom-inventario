<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Cantidades, Inventario, Lista, Producto } from '@/servicios/modelos.ts';
import { onMounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import EditarQuitar from '../componentes/EditarQuitar.vue';
import * as StorageService from '@/servicios/StorageService.ts';
import { Usuario } from '@/servicios/appwrite';

const router = useRouter();
const confirm = useConfirm();

const estanteQueryString = (router.currentRoute.value.params.estante as string).split('-');
const dialogoEstante = ref(false);
const estante = ref<Inventario>({ $id: estanteQueryString[0] ?? '', padre: estanteQueryString[1] ?? '', actual: estanteQueryString[2] ?? '', nivel: parseInt(estanteQueryString[3] ?? '0') });

const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: estante.value.actual, nivel: null });
const esNuevo = ref(false);
const tipoEdicion = ref<'Cajón' | 'Caja' | ''>('');

const mostrarDialogoProducto = ref(false);
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string>('');
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);
const cantidad = ref<number>(1);
const cajaSeleccionada = ref<Inventario | null>(null);
const productosEnCaja = ref<Cantidades[]>([]);
const mostrarDialogoCaja = ref(false);
const gruposDict = ref<Record<string, string>>({});
const fabricantesDict = ref<Record<string, string>>({});

onMounted(() => {
  grupos.value = TablesDbService.ObtenerLista('grupos');
  gruposDict.value = Object.fromEntries(grupos.value.map(x => [x.$id, x.nombre]));
  const fabricantes = TablesDbService.ObtenerLista('fabricantes');
  fabricantesDict.value = Object.fromEntries(fabricantes.map(x => [x.$id, x.nombre]));
})

watchEffect(async () => {
  if (grupoSeleccionado.value) {
    productosDelGrupo.value = (await TablesDbService.ObtenerProductosPorGrupo(grupoSeleccionado.value)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
});

function Agregar(padre: string, tipoEdicionParam: 'Cajón' | 'Caja') {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: padre, nivel: tipoEdicionParam === 'Cajón' ? 1 : null };
  dialogVisible.value = true;
  tipoEdicion.value = tipoEdicionParam;
}

function Editar(item: Inventario, tipoEdicionParam: 'Cajón' | 'Caja') {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
  tipoEdicion.value = tipoEdicionParam;
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
  }
  dialogVisible.value = false;
}

function Quitar(item: Inventario, tipoEdicionParam: 'Cajón' | 'Caja'): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar ${tipoEdicionParam}: ${item.actual} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      const indice = TablesDbService.Inventarios.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        await TablesDbService.Eliminar('inventario', item.$id);
        TablesDbService.Inventarios.value.splice(indice, 1);
      }
    }
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
  productosEnCaja.value.push({ ...item, producto: productoSeleccionado.value });
  mostrarDialogoProducto.value = false;
}

async function VerCaja(caja: Inventario) {
  productosEnCaja.value = await TablesDbService.ObtenerCantidadesEnCaja(caja.$id);
  cajaSeleccionada.value = caja;
  mostrarDialogoCaja.value = true;
}

async function GuardarEstante() {
  await TablesDbService.Actualizar('inventario', estante.value);
  const globalIndice = TablesDbService.Inventarios.value.findIndex(x => x.$id === estante.value.$id);
  if (globalIndice >= 0) {
    TablesDbService.Inventarios.value[globalIndice] = { ...estante.value };
  }
  dialogoEstante.value = false;
}
</script>

<template>
  <div id="encabezado" class="flex justify-between items-center">
    <Button :label="`Galpón ${estanteQueryString[4]}`" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push(`/galpon/${estante.padre}`)" />
    <div class="text-xl">ESTANTE {{estante.actual}}</div>
    <div>
      <Button v-if="Usuario" label="Estante" icon="pi pi-pen-to-square" severity="success" variant="outlined" class="mr-2" @click="() => dialogoEstante = true" />
      <Button v-if="Usuario" label="Cajón" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar(estante.$id, 'Cajón')" />
    </div>
  </div>

  <div v-for="nivel in estante.nivel" :key="nivel">
     <Fieldset :legend="`Nivel ${nivel}`">
      <div class="flex flex-row gap-2">
        <div v-if="TablesDbService.Inventarios.value.filter(x => x.padre == estante.$id && x.nivel == nivel).length === 0" class="italic text-muted-color">
          No hay cajones en este nivel.
        </div>
        <Panel v-else v-for="cajon in TablesDbService.Inventarios.value.filter(x => x.padre == estante.$id && x.nivel == nivel)" :key="cajon.$id" :header="cajon.actual" :pt:header:class="Usuario ? '' : 'justify-center'">
          <template #icons v-if="Usuario">
            <div class="flex">
              <Button label="Caja" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar(cajon.$id, 'Caja')" />
              <EditarQuitar @editar-click="Editar(cajon, 'Cajón')" @quitar-click="Quitar(cajon, 'Cajón')" />
            </div>
          </template>
          <div v-if="TablesDbService.Inventarios.value.filter(x => x.padre == cajon.$id).length === 0" class="italic text-muted-color m-1">
            No hay cajas en esta cajón.
          </div>
          <div v-else v-for="caja in TablesDbService.Inventarios.value.filter(x => x.padre == cajon.$id)" :key="caja.$id" class="mt-2 p-1 border-1 rounded-md border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
              <div class="flex">
                <Button variant="text" severity="warn" size="small" :label="'Caja ' + caja.actual" @click="VerCaja(caja)" />
                <Button v-if="Usuario" icon="pi pi-plus" severity="info" size="small" variant="text" @click="AgregarProductoACaja(caja)" />
                <EditarQuitar v-if="Usuario" tamaño="small" @editar-click="Editar(caja, 'Caja')" @quitar-click="Quitar(caja, 'Caja')" />
              </div>
          </div>
        </Panel>
      </div>
    </Fieldset>
  </div>

  <DialogoEdicion id="editarCajonCaja" v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" :nombre-objeto="tipoEdicion"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full mt-1">
        <label for="nombre">{{ tipoEdicion }}</label>
        <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none" @keyup.enter="Guardar" />
      </FloatLabel>
      <FloatLabel variant="on" class="w-full" v-if="tipoEdicion === 'Cajón'">
        <InputNumber id="nivel" v-model="itemEdicion.nivel" class="w-full" :invalid="!itemEdicion?.nivel" aria-autocomplete="none"  @keyup.enter="Guardar" showButtons :max="estante.nivel ?? 1" :min="1" />
        <label for="nivel">Nivel</label>
      </FloatLabel>
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

  <Dialog v-model:visible="mostrarDialogoCaja" :header="`Caja ${cajaSeleccionada?.actual}`" :modal="true" class="md:w-2xl">
    <div v-if="productosEnCaja.length === 0" class="italic text-muted-color">No hay productos en esta caja</div>
    <div v-else v-for="item in productosEnCaja" :key="item.$id" class="p-2 border-2 rounded-md border-gray bg-yellow-50 dark:bg-yellow-900 mb-2">
      <div class="flex justify-between">
        <div>
          <div><b>Nombre: </b>{{ (item.producto as Producto).nombre }}</div>
          <div><b>Grupo: </b>{{ gruposDict[(item.producto as Producto).grupo] }}</div>
          <div><b>Fabricante: </b>{{ fabricantesDict[(item.producto as Producto).fabricante] }}</div>
          <div><b>Código: </b>{{ (item.producto as Producto).codigo }}</div>
          <br />
          <div><b>Cantidad: </b>{{ item.cantidad }}</div>
          <div><b>Peso Unitario: </b>{{ (item.producto as Producto).pesoUnitario }} Kg.</div>
          <div><b>Peso Total: </b>{{ ((item.producto as Producto).pesoUnitario * item.cantidad).toFixed(2) }} Kg.</div>
        </div>
        <img :src="(item.producto as Producto).imagenId ? StorageService.Url((item.producto as Producto).imagenId ?? '') : undefined" alt="Foto" class="rounded-xl w-49 h-49" />
      </div>
      <div><b>Descripción: </b>{{ (item.producto as Producto).descripcion }}</div>
    </div>
  </Dialog>

  <DialogoEdicion id="editarEstante" v-model:mostrar="dialogoEstante" :esAgregar="false" :clickAceptar="GuardarEstante" nombre-objeto="Estante"
    :desabilitarAceptar="estante.actual.trim() === ''">
    <div class="flex flex-col gap-3 pt-1">
      <FloatLabel variant="on" class="w-full">
        <InputText id="nombre" v-model="estante.actual" autofocus class="w-full" :invalid="!estante?.actual" aria-autocomplete="none"  @keyup.enter="GuardarEstante" />
        <label for="nombre">Estante</label>
      </FloatLabel>
      <FloatLabel variant="on" class="w-full">
        <InputNumber id="niveles" v-model="estante.nivel" class="w-full" :invalid="!estante?.nivel" aria-autocomplete="none"  @keyup.enter="GuardarEstante" showButtons :min="1" />
        <label for="niveles">Niveles</label>
      </FloatLabel>
    </div>
  </DialogoEdicion>
</template>
