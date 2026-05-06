<script setup lang="ts">
import { useGlobalStore } from '@/servicios/globalStore';
import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';

const globalStore = useGlobalStore();
const router = useRouter();

const imprimir = () =>  window.print();
const opciones = ['Todo', 'Título', 'Ficha Técnica'];
const selectedOption = ref('Todo');

const productosMap = computed(() => new Map(globalStore.Productos.map(p => [p.id, p])));

function Ubicaciones(productoId: string): string[] {
  const cantidades = globalStore.ObtenerCantidadesPorProducto(productoId);
  return globalStore.ObtenerUbicaciones(cantidades);
}
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

  <div v-if="$route.params.tipo == 'caja'" class="texto-negro">
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

  <div v-if="$route.params.tipo == 'solicitud'" class="max-w-xl mx-auto texto-negro">
    <div class="text-3xl text-center mb-8 font-semibold">SOLICITUD DE PRODUCTOS</div>

    <!-- Datos del solicitante -->
    <div class="border border-2 rounded-lg mb-4 px-4 py-2 bg-gray-100">
      <p><b>Solicitante:</b> {{ globalStore.solicitudActual.solicitante }}</p>
      <p class="mt-1"><b>Teléfono:</b> {{ globalStore.solicitudActual.telefono }}</p>
      <p class="mt-1"><b>Dirección:</b> {{ globalStore.solicitudActual.direccion }}</p>
      <p class="mt-1"><b>Fecha de Solicitud:</b> {{ globalStore.solicitudActual.fechaCreacion.toLocaleDateString('es-VE') }}</p>
    </div>

    <!-- Tabla de productos -->
    <table class="w-full border-collapse text-sm mb-4">
      <thead>
        <tr class="border bg-gray-100 text-center">
          <th class="border px-2 py-1">#</th>
          <th class="border px-2 py-1">NOMBRE</th>
          <th class="border px-2 py-1">CÓDIGO</th>
          <th class="border px-2 py-1">CANTIDAD</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(item, index) in globalStore.solicitudActual.productosCantidad" :key="item.productoId">
          <tr class="border text-center">
            <td class="border px-2 py-1 bg-gray-100 font-bold" rowspan="2">{{ index + 1 }}</td>
            <td class="border px-2 py-1">{{ productosMap.get(item.productoId)?.nombre ?? item.productoId }}</td>
            <td class="border px-2 py-1">{{ productosMap.get(item.productoId)?.codigo ?? '' }}</td>
            <td class="border px-2 py-1 text-center">{{ item.cantidad }}</td>
          </tr>
          <tr>
            <td class="border px-2 py-1" colspan="3">
              <div><b>Ubicación:</b></div>
              <ul class="list-disc list-inside">
                <li v-for="(ubic, index) in Ubicaciones(item.productoId)" :key="index">{{ ubic }}</li>
              </ul>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>

  <div v-else class="flex justify-center text-center items-center min-h-screen font-bold texto-negro">
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
      {{ globalStore.listaSeleccionada?.nombre.substring(globalStore.listaSeleccionada?.nombre.indexOf('-') + 2) }}
    </div>
    <div v-else-if="$route.params.tipo == 'gruposEstante'" class="text-[8rem]">
      <div v-for="grupo in globalStore.ObtenerGruposEnEstanteSeleccionado()" :key="grupo">
        <div class="underline">GRUPO</div>
        {{ grupo.substring(grupo.indexOf('-') + 2) }}
      </div>
    </div>
  </div>

</template>
