<script setup lang="ts">
import * as TablesDbService from '@/servicios/TablesDbService';
import type { Inventario } from '@/servicios/modelos.ts';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import DialogoEdicion from '@/componentes/DialogoEdicion.vue';

const router = useRouter();

const contenidoEstante = ref<Inventario[]>([]);
const dialogVisible = ref(false);
const itemEdicion = ref<Inventario>({ $id: '', actual: '', padre: router.currentRoute.value.params.id as string, producto: null, cantidad: null });
const esNuevo = ref(false);

onMounted(async () => {
  contenidoEstante.value = await TablesDbService.ObtenerContenidoEstante(router.currentRoute.value.params.id as string);
})

function Agregar(padre: string) {
  esNuevo.value = true;
  itemEdicion.value = { $id: '', actual: '', padre: padre, producto: null, cantidad: null };
  dialogVisible.value = true;
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
</script>

<template>
  <div class="flex  justify-between items-center mb-3">
    <Button label="Galpón" icon="pi pi-arrow-left" severity="secondary" variant="outlined" @click="() => router.push(`/galpon/${$route.params.galpon}`)" />
    <div class="text-xl">ESTANTE {{$route.params.estante}}</div>
    <Button label="Sección" icon="pi pi-plus" severity="info" variant="outlined" @click="Agregar($route.params.estante as string)" />
  </div>

  <DialogoEdicion v-model:mostrar="dialogVisible" :esAgregar="esNuevo" :clickAceptar="Guardar"
    :desabilitarAceptar="itemEdicion.actual.trim() === ''">
    <FloatLabel variant="on" class="w-full mt-1">
      <label for="nombre">Nombre</label>
      <InputText id="nombre" v-model="itemEdicion.actual" autofocus class="w-full" :invalid="!itemEdicion?.actual" aria-autocomplete="none" />
    </FloatLabel>
  </DialogoEdicion>
</template>
