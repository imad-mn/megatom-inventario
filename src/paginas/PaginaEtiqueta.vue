<script setup lang="ts">
import { useGlobalStore } from '@/servicios/globalStore';

const globalStore = useGlobalStore();
const imprimir = () =>  window.print();
</script>

<template>
  <div class="flex justify-center items-center mb-6 noprint">
    <div class="text-center text-2xl mr-3">ETIQUETA DE CAJÓN</div>
    <Button icon="pi pi-print" severity="secondary" label="Imprimir" @click="imprimir()" />
  </div>

  <div class="max-w-5xl mx-auto">
    <div v-for="item in globalStore.ProductosEnCaja" :key="item.id" class="mb-2">
      <div class="text-center w-full py-15 text-7xl text-wrap font-bold border-b-3 border-b-gray-500">
        <div class="underline">CAJÓN #{{ globalStore.CajaSeleccionada?.nombre }}</div>
        <div class="mt-8">{{ item.producto.nombre }}</div>
      </div>
      <div class="flex justify-between items-center p-3 border-3 rounded-md border-gray-500 mt-3">
        <div class="w-full">
          <div class="text-center text-4xl font-semibold underline mb-4">CAJÓN #{{ globalStore.CajaSeleccionada?.nombre }}</div>
          <p class="text-wrap text-2xl/8">
            <b>NOMBRE: </b>{{ item.producto.nombre }} <br />
            <b>GRUPO: </b>{{ globalStore.ListasMap[item.producto.grupoId] }} <br />
            <b>FABRICANTE: </b>{{ globalStore.ListasMap[item.producto.fabricanteId] }} <br />
            <b>CÓDIGO-SERIAL: </b>{{ item.producto.codigo }} <br />
            <br />
            <b>CANTIDAD: </b>{{ item.cantidad }} UNIDADES <br />
            <b>PESO UNITARIO: </b>{{ item.producto.pesoUnitario }} KG <br />
            <b>PESO TOTAL: </b>{{ (item.producto.pesoUnitario * item.cantidad).toFixed(2) }} KG <br />
            <b>DETALLE: </b>{{ item.producto.descripcion }}
          </p>
        </div>
        <img :hidden="!item.producto.imagenUrl"
          :src="item.producto.imagenUrl ? item.producto.imagenUrl : undefined"
          alt="Foto" class="rounded-xl md:w-86 md:h-86" />
      </div>
    </div>
  </div>
</template>
