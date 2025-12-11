<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Cantidades, Inventario, Lista, Producto } from '@/servicios/modelos.ts';
import { onMounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import EditarQuitar from '../componentes/EditarQuitar.vue';

const router = useRouter();
const confirm = useConfirm();

const estanteNombre = router.currentRoute.value.params.estante as string;
const contenidoEstante = ref<Inventario[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: estanteNombre });
const esNuevo = ref(false);
const tipoEdicion = ref<'Sección' | 'Cajón' | ''>('');

const mostrarDialogoProducto = ref(false);
const grupos = ref<Lista[]>([]);
const grupoSeleccionado = ref<string>('');
const productosDelGrupo = ref<Producto[]>([]);
const productoSeleccionado = ref<Producto | null>(null);
const cantidad = ref<number>(1);
const cajonSeleccionado = ref<Inventario | null>(null);
const productosEnCajones = ref<Cantidades[]>([]);

onMounted(async () => {
  contenidoEstante.value = await TablesDbService.ObtenerContenidoEstante(estanteNombre);
  grupos.value = await TablesDbService.ObtenerLista('grupos');
  productosEnCajones.value = await TablesDbService.ObtenerCantidadesPorCajones(contenidoEstante.value.map(x => x.$id));
})

watchEffect(async () => {
  if (grupoSeleccionado.value) {
    productosDelGrupo.value = (await TablesDbService.ObtenerProductosPorGrupo(grupoSeleccionado.value)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
});

function Agregar(padre: string, tipoEdicionParam: 'Sección' | 'Cajón') {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: padre };
  dialogVisible.value = true;
  tipoEdicion.value = tipoEdicionParam;
}

function Editar(item: Inventario, tipoEdicionParam: 'Sección' | 'Cajón') {
  esNuevo.value = false;
  itemEdicion.value = { ...item };
  dialogVisible.value = true;
  tipoEdicion.value = tipoEdicionParam;
}

async function Guardar() {
  if (esNuevo.value) {
    await TablesDbService.Crear('inventario', itemEdicion.value);
    contenidoEstante.value.push({ ...itemEdicion.value });
  } else {
    const indice = contenidoEstante.value.findIndex(x => x.$id === itemEdicion.value.$id);
    if (indice >= 0) {
      await TablesDbService.Actualizar('inventario', itemEdicion.value);
      contenidoEstante.value[indice] = { ...itemEdicion.value };
    }
  }
  dialogVisible.value = false;
}

function Quitar(item: Inventario, tipoEdicionParam: 'Sección' | 'Cajón'): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar ${tipoEdicionParam}: ${item.actual} ?`,
    acceptClass: 'p-button-danger p-button-outlined',
    rejectClass: 'p-button-secondary p-button-outlined',
    acceptIcon: 'pi pi-trash',
    accept: async () => {
      const indice = contenidoEstante.value.findIndex(x => x.$id === item.$id);
      if (indice >= 0) {
        await TablesDbService.Eliminar('inventario', item.$id);
        contenidoEstante.value.splice(indice, 1);
      }
    }
  });
}

function AgregarProductoACajon(cajon: Inventario) {
  mostrarDialogoProducto.value = true;
  productoSeleccionado.value = null;
  cantidad.value = 1;
  cajonSeleccionado.value = cajon;
}

async function GuardarProducto() {
  if (productoSeleccionado.value == null || cajonSeleccionado.value == null || cantidad.value <= 0)
    return;
  const item: Cantidades = {
    $id: '',
    producto: productoSeleccionado.value.$id,
    cantidad: cantidad.value,
    cajon: cajonSeleccionado.value.$id
  };
  await TablesDbService.Crear('cantidades', item);
  productosEnCajones.value.push({ ...item, producto: productoSeleccionado.value });
  mostrarDialogoProducto.value = false;
}
</script>

<template>
  <div class="flex  justify-between items-center mb-3">
    <Button :label="`Galpón ${$route.params.galpon}`" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push(`/galpon/${$route.params.galpon}`)" />
    <div class="text-xl">ESTANTE {{estanteNombre}}</div>
    <Button label="Sección" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar(estanteNombre, 'Sección')" />
  </div>

  <div class="flex flex-wrap gap-3">
    <div v-for="seccion in contenidoEstante.filter(x => x.padre == estanteNombre)" :key="seccion.$id">
      <Panel :header="'Sección ' + seccion.actual" class="w-full md:w-sm">
        <template #icons>
          <div class="flex">
            <Button label="Cajón" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar(`${estanteNombre}-${seccion.actual}`, 'Cajón')" />
            <EditarQuitar @editar-click="Editar(seccion, 'Sección')" @quitar-click="Quitar(seccion, 'Sección')" />
          </div>
        </template>
        <Fieldset v-for="cajon in contenidoEstante.filter(x => x.padre == `${estanteNombre}-${seccion.actual}`)" :key="cajon.$id">
          <template #legend>
          <div class="flex items-center">
            <span class="mr-2">Cajón {{ cajon.actual }}</span>
            <EditarQuitar tamaño="small" @editar-click="Editar(cajon, 'Cajón')" @quitar-click="Quitar(cajon, 'Cajón')" />
            <Button icon="pi pi-plus-circle" severity="info" variant="text" size="small" @click="AgregarProductoACajon(cajon)" />
          </div>
          </template>
          <ul style="list-style-type: square;" class="ml-4">
            <li v-for="item in productosEnCajones.filter(x => x.cajon == cajon.$id)" :key="item.$id">
              {{ item.cantidad }} x {{ (item.producto as Producto).nombre }}
            </li>
          </ul>
          <div v-if="productosEnCajones.filter(x => x.cajon == cajon.$id).length === 0" class="italic text-gray-500">
            No hay productos en este cajón.
          </div>
          <div v-else class="font-bold mt-2">
            Peso total: {{ productosEnCajones.filter(x => x.cajon == cajon.$id).reduce((sum, item) => sum + item.cantidad * ((item.producto as Producto).pesoUnitario ?? 0), 0) }} Kg.
          </div>
        </Fieldset>
      </Panel>
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar" :nombre-objeto="tipoEdicion"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">{{ tipoEdicion }}</label>
      <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none" @keyup.enter="Guardar" />
    </FloatLabel>
  </DialogoEdicion>

  <DialogoEdicion v-model:mostrar="mostrarDialogoProducto" :esAgregar="true" :clickAceptar="GuardarProducto" nombre-objeto="Producto"
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
</template>
