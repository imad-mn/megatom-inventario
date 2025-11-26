<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useConfirm } from "primevue/useconfirm";
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';
import EditarQuitar from '../componentes/EditarQuitar.vue';

const router = useRouter();
const confirm = useConfirm();

const estanteNombre = router.currentRoute.value.params.estante as string;
const contenidoEstante = ref<Inventario[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: estanteNombre, producto: null, cantidad: null });
const esNuevo = ref(false);
const tipoEdicion = ref<'Sección' | 'Cajón' | ''>('');

onMounted(async () => {
  contenidoEstante.value = await TablesDbService.ObtenerContenidoEstante(estanteNombre);
})

function Agregar(padre: string, tipoEdicionParam: 'Sección' | 'Cajón') {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: padre, producto: null, cantidad: null };
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

function Quitar(item: Inventario): void {
  confirm.require({
    header: 'Eliminar',
    message: `¿Estás seguro de eliminar la Sección: ${item.actual} ?`,
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
</script>

<template>
  <div class="flex  justify-between items-center mb-3">
    <Button :label="`Galpón ${$route.params.galpon}`" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push(`/galpon/${$route.params.galpon}`)" />
    <div class="text-xl">ESTANTE {{estanteNombre}}</div>
    <Button label="Sección" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar(estanteNombre, 'Sección')" />
  </div>

  <div class="flex flex-wrap gap-3">
    <div v-for="seccion in contenidoEstante.filter(x => x.padre == estanteNombre)" :key="seccion.$id">
      <Panel :header="'Sección ' + seccion.actual" class="w-full md:w-xs">
        <template #icons>
          <div class="flex gap-1">
            <Button label="Cajón" icon="pi pi-plus" severity="info" size="small" variant="text" @click="Agregar(`${estanteNombre}-${seccion.actual}`, 'Cajón')" />
            <EditarQuitar @editar-click="Editar(seccion, 'Sección')" @quitar-click="Quitar(seccion)" />
          </div>
        </template>
        <Fieldset v-for="cajon in contenidoEstante.filter(x => x.padre == `${estanteNombre}-${seccion.actual}`)" :key="cajon.$id" :legend="'Cajón ' + cajon.actual">
        </Fieldset>
      </Panel>
    </div>
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">{{ tipoEdicion }}</label>
      <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none" />
    </FloatLabel>
  </DialogoEdicion>
</template>
