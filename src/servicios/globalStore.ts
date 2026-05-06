import type { Cantidades, CantidadesConProducto, Estante, Galpon, IdNombre, Lista, Producto, ProductoConCantidad, Solicitud } from './modelos';
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
  const CajaSeleccionada = ref<IdNombre | null>(null);
  const ProductosEnCaja = ref<CantidadesConProducto[]>([]);
  const listaSeleccionada = ref<IdNombre | null>(null);

  const dialogoHistorial = ref({ mostrar: false, idElemento: '', nombreElemento: '' });
  const solicitudActual = ref<Solicitud>({ id: '', fechaCreacion: new Date(), solicitante: '', direccion: '', telefono: '', procesada: false, productosCantidad: [] });

  async function CargarTodo() {
    Promise.all([
      ObtenerTodos<Producto>(Coleccion.Productos),
      ObtenerTodos<Galpon>(Coleccion.Galpones),
      ObtenerTodos<Lista>(Coleccion.Listas),
      ObtenerTodos<Cantidades>(Coleccion.Cantidades)
    ]).then(([productos, galpones, listas, cantidades]) => {
      Productos.value = productos;
      Galpones.value = galpones.sort((a, b) => a.nombre.localeCompare(b.nombre));
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

  function ObtenerProductosConCantidad(): ProductoConCantidad[] {
    return Productos.value.map(p => ({
      ...p,
      cantidad: Cantidades.value.filter(c => c.productoId == p.id).reduce((acc, c) => acc + c.cantidad, 0)
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

  function ObtenerGruposEnEstanteSeleccionado(): string[] {
    if (!EstanteSeleccionado.value) return [];

    const gruposSet = new Set<string>();

    for (const nivel of EstanteSeleccionado.value.niveles) {
      for (const seccion of nivel.secciones) {
        for (const caja of seccion.cajas) {
          const cantidades = Cantidades.value.filter(c => c.cajaId === caja.id);
          for (const cantidad of cantidades) {
            const producto = Productos.value.find(p => p.id === cantidad.productoId);
            if (producto && producto.grupoId) {
              gruposSet.add(producto.grupoId);
            }
          }
        }
      }
    }

    return Array.from(gruposSet).map(grupoId => ListasMap.value[grupoId] || 'Grupo Desconocido');
  }

  return {
    Listas,
    ListasMap,
    Galpones,
    Productos,
    Cantidades,
    GalponSeleccionado,
    EstanteSeleccionado,
    CajaSeleccionada,
    ProductosEnCaja,
    dialogoHistorial,
    listaSeleccionada,
    solicitudActual,

    CargarTodo,
    ObtenerLista,
    ObtenerCantidadesPorProducto,
    ObtenerCantidadesConProductos,
    ObtenerProductosConCantidad,
    ObtenerUbicaciones,
    ObtenerGruposEnEstanteSeleccionado
  };
});
