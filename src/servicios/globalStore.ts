import type { Cantidades, CantidadesConProducto, Estante, Galpon, Lista, Producto } from './modelos';
import { computed, ref } from 'vue';
import { defineStore } from 'pinia'
import { Coleccion, ObtenerTodos } from './TablesDbService';

export const useGlobalStore = defineStore('global', () => {
  const Listas = ref<Lista[]>([]);
  const Galpones = ref<Galpon[]>([]);
  const Productos = ref<Producto[]>([]);
  const Cantidades = ref<Cantidades[]>([]);

  const GalponSeleccionado = ref<Galpon | null>(null);
  const EstanteSeleccionado = ref<Estante | null>(null);

  const dialogoHistorial = ref({ mostrar: false, idElemento: '', nombreElemento: '' });

  async function CargarTodo() {
    Promise.all([
      ObtenerTodos<Producto>(Coleccion.Productos),
      ObtenerTodos<Galpon>(Coleccion.Galpones),
      ObtenerTodos<Lista>(Coleccion.Listas),
      ObtenerTodos<Cantidades>(Coleccion.Cantidades)
    ]).then(([productos, galpones, listas, cantidades]) => {
      Productos.value = productos;
      Galpones.value = galpones;
      Listas.value = listas;
      Cantidades.value = cantidades;
    });
  }

  function ObtenerLista(tipo: string): Lista[] {
    const filtrados = Listas.value.filter(x => x.tipo == tipo);
    return [...filtrados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  const ListasMap = computed(() => Object.fromEntries(new Map(Listas.value.map(l => [l.id, l.nombre]))));

  function ObtenerCantidadesPorProducto(productoId: string): Cantidades[] {
    return Cantidades.value.filter(c => c.productoId === productoId);
  }

  function ObtenerCantidadesConProductos(): CantidadesConProducto[] {
    const productosMap = new Map(Productos.value.map(p => [p.id, p]));

    return Cantidades.value.map(cantidad => ({
      ...cantidad,
      producto: productosMap.get(cantidad.productoId)!
    }));
  }

  function ObtenerUbicaciones(cantidades: Cantidades[]): string[] {
    const ubicaciones: string[] = [];

    for (const cantidad of cantidades) {
      for (const galpon of Galpones.value) {
        for (const estante of galpon.estantes) {
          for (const nivel of estante.niveles) {
            for (const seccion of nivel.secciones) {
              const caja = seccion.cajas.find(c => c.id === cantidad.cajaId);
              if (caja) {
                ubicaciones.push(`Galpón ${galpon.nombre} / Estante ${estante.nombre} / Nivel ${nivel.nombre} / Sección ${seccion.nombre} / Caja ${caja.nombre} / ${cantidad.cantidad} unidades\n`);
              }
            }
          }
        }
      }
    }

    if (ubicaciones.length === 0)
      ubicaciones.push('No hay ubicaciones.');

    return ubicaciones;
  }

  return {
    Listas,
    ListasMap,
    Galpones,
    Productos,
    Cantidades,
    GalponSeleccionado,
    EstanteSeleccionado,
    dialogoHistorial,

    CargarTodo,
    ObtenerLista,
    ObtenerCantidadesPorProducto,
    ObtenerCantidadesConProductos,
    ObtenerUbicaciones,
  };
});
