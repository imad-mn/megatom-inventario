<script setup lang="ts">
import { useGlobalStore } from '@/servicios/globalStore';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const globalStore = useGlobalStore();
const router = useRouter();

const imprimir = () =>  window.print();
const opciones = ['Ambos', 'Solo titulo', 'Solo recuadro'];
const selectedOption = ref('Ambos');
</script>

<template>
  <div class="flex justify-between items-center noprint">
    <Button icon="pi pi-arrow-left" label="Estante" severity="secondary" variant="outlined" @click="() => router.push('/estante')" />
    <div class="text-2xl">ETIQUETA DE CAJÓN</div>
    <div>
      <Select :options="opciones" v-model="selectedOption" class="mr-2" />
      <Button icon="pi pi-print" severity="contrast" variant="outlined" label="Imprimir" @click="imprimir()" />
    </div>
  </div>

  <div class="max-w-5xl mx-auto">
    <div v-for="item in globalStore.ProductosEnCaja" :key="item.id">
      <div v-if="['Ambos', 'Solo titulo'].includes(selectedOption)" class="break-before-page text-center w-full py-5 text-8xl text-wrap font-bold">
        <div class="underline">CAJÓN #{{ globalStore.CajaSeleccionada?.nombre }}</div>
        <div class="mt-15">{{ item.producto.nombre }}</div>
        <p class="border-t-4 mt-10 pt-10">{{ item.cantidad.toLocaleString('es-VE') }} UNIDADES</p>
        <p class="mt-5">{{ (item.producto.pesoUnitario * item.cantidad).toLocaleString('es-VE', { maximumFractionDigits: 0 }) }} KG</p>
      </div>

      <div v-if="['Ambos', 'Solo recuadro'].includes(selectedOption)" class="break-before-page my-35 flex">
        <div class="p-3 border-3 rounded-2xl border-gray-500 grow">
          <div class="text-center text-4xl font-semibold underline mb-10">CAJÓN #{{ globalStore.CajaSeleccionada?.nombre }}</div>
          <p class="text-nowrap text-2xl/8">
            <b>NOMBRE: </b>{{ item.producto.nombre }} <br />
            <b>GRUPO: </b>{{ globalStore.ListasMap[item.producto.grupoId] }} <br />
            <b>FABRICANTE: </b>{{ globalStore.ListasMap[item.producto.fabricanteId] }} <br />
            <b>CÓDIGO-SERIAL: </b>{{ item.producto.codigo }} <br />
            <br />
            <b>CANTIDAD: </b>{{ item.cantidad.toLocaleString('es-VE') }} UNIDADES <br />
            <b>PESO UNITARIO: </b>{{ item.producto.pesoUnitario }} KG <br />
            <b>PESO TOTAL: </b>{{ (item.producto.pesoUnitario * item.cantidad).toLocaleString('es-VE') }} KG <br />
            <b>DETALLE: </b>{{ item.producto.descripcion }}
          </p>
        </div>
        <img :hidden="!item.producto.imagenUrl"
          :src="item.producto.imagenUrl ? item.producto.imagenUrl : undefined"
          alt="Foto" class="ml-2 rounded-2xl min-w-0" />
      </div>
    </div>
  </div>
</template>
