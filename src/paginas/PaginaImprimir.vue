<script setup lang="ts">
import { useGlobalStore } from '@/servicios/globalStore';
import { useRouter } from 'vue-router';
import { ref } from 'vue';

const globalStore = useGlobalStore();
const router = useRouter();

const imprimir = () =>  window.print();
const opciones = ['Todo', 'Título', 'Ficha Técnica'];
const selectedOption = ref('Todo');
</script>

<template>
  <div class="flex justify-between items-center noprint pb-3">
    <Button icon="pi pi-arrow-left" label="Atrás" severity="secondary" variant="outlined" @click="() => router.back()" />
    <div class="text-2xl">IMPRIMIR</div>
    <div>
      <Select v-if="$route.params.tipo == 'caja'" :options="opciones" v-model="selectedOption" class="mr-2" />
      <Button icon="pi pi-print" severity="contrast" variant="outlined" label="Imprimir" @click="imprimir()" />
    </div>
  </div>

  <div v-if="$route.params.tipo == 'caja'">
    <div v-for="item in globalStore.ProductosEnCaja" :key="item.id">
      <div v-if="['Todo', 'Título'].includes(selectedOption)" class="min-h-screen flex items-center justify-center">
        <div class="text-center text-8xl text-wrap font-bold">
          <div class="underline">CAJÓN #{{ globalStore.CajaSeleccionada?.nombre }}</div>
          <div class="mt-15">{{ item.producto.nombre }}</div>
          <p class="border-t-4 mt-10 pt-10">{{ item.cantidad.toLocaleString('es-VE') }} UNIDADES</p>
          <p class="mt-5">{{ (item.producto.pesoUnitario * item.cantidad).toLocaleString('es-VE', { maximumFractionDigits: 1 }) }} KG</p>
        </div>
      </div>

      <div v-if="['Todo', 'Ficha Técnica'].includes(selectedOption)" class="min-h-screen flex items-center">
        <div class="p-3 border-3 rounded-2xl border-gray-500 grow">
          <div class="text-center text-4xl font-semibold underline mb-10">CAJÓN #{{ globalStore.CajaSeleccionada?.nombre }}</div>
          <p class="text-nowrap text-2xl/8">
            <b>NOMBRE: </b>{{ item.producto.nombre }} <br />
            <b>GRUPO: </b>{{ item.producto.grupoId ? globalStore.ListasMap[item.producto.grupoId] : ''}} <br />
            <b>FABRICANTE: </b>{{ item.producto.fabricanteId ? globalStore.ListasMap[item.producto.fabricanteId] : '' }} <br />
            <b>CÓDIGO-SERIAL: </b>{{ item.producto.codigo }} <br />
            <br />
            <b>CANTIDAD: </b>{{ item.cantidad.toLocaleString('es-VE') }} UNIDADES <br />
            <b>PESO UNITARIO: </b>{{ item.producto.pesoUnitario }} KG <br />
            <b>PESO TOTAL: </b>{{ (item.producto.pesoUnitario * item.cantidad).toLocaleString('es-VE') }} KG <br />
            <b>ESTADO: </b>{{ item.producto.estadoId ? globalStore.ListasMap[item.producto.estadoId] : '' }}<br />
            <b>DETALLE: </b>{{ item.producto.descripcion }}
          </p>
        </div>
        <img :hidden="!item.producto.imagenUrl"
          :src="item.producto.imagenUrl ? item.producto.imagenUrl : undefined"
          alt="Foto" class="ml-2 rounded-2xl min-w-0" />
      </div>
    </div>
  </div>

  <div v-else class="flex justify-center text-center items-center min-h-screen font-bold">
    <div v-if="$route.params.tipo == 'galpon'" class="text-[11rem]">
      <div class="underline">GALPÓN {{ globalStore.GalponSeleccionado!.nombre }}</div>
      <div>{{ globalStore.GalponSeleccionado?.descripcion }}</div>
    </div>
    <div v-else-if="$route.params.tipo == 'estante'" class="text-[43rem]">
      {{ globalStore.EstanteSeleccionado!.nombre }}
    </div>
    <div v-else-if="$route.params.tipo == 'secciones'" class="w-full grid grid-cols-3 text-[9rem]">
      <div v-for="seccion in globalStore.EstanteSeleccionado?.niveles.flatMap(n => n.secciones)" :key="seccion.id"
        class="border-2 border-gray-500 text-center py-5">
        {{ seccion.nombre }}
      </div>
    </div>
    <div v-else-if="$route.params.tipo == 'grupos'" class="text-[8rem]">
      <div class="underline">GRUPO</div>
      {{ globalStore.listaSeleccionada?.nombre }}
    </div>
    <div v-else-if="$route.params.tipo == 'gruposEstante'" class="text-[8rem]">
      <div v-for="grupo in globalStore.ObtenerGruposEnEstanteSeleccionado()" :key="grupo">
        <div class="underline">GRUPO</div>
        {{ grupo }}
      </div>
    </div>
  </div>

</template>
