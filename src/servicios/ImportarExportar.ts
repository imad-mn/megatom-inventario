import Papa from 'papaparse';
import { Actualizar, Coleccion, Crear } from './TablesDbService';
import type { Estante, Galpon, Historial, IdNombre, Lista, Nivel, Producto, Seccion } from './modelos';
import { useGlobalStore } from './globalStore';
import { RegistrarHistorial } from './historialService';

export type Fila = {
  galpon: string;
  estante: string;
  nivel: string;
  seccion: string;
  cajon: string;
  nombre: string;
  grupo: string;
  fabricante: string;
  codigo: string;
  cantidad: string;
  pesoUnitario: string;
  pesoTotal: string;
  descripcion: string;
  estado: string;
};

/** Contexto compartido durante la importación: datos ya cargados y mutables para ir agregando nuevos. */
interface ContextoImportacion {
  grupos: Lista[];
  fabricantes: Lista[];
  estados: Lista[];
  galponesModificados: Set<string>;
}

function parsearCsv(file: File): Promise<Fila[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Fila>(file, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      encoding: "ISO-8859-1",
      transformHeader: (header: string): string => {
        const headerMap: Record<string, string> = {
          'GALPÓN': 'galpon',
          'ESTANTE': 'estante',
          'NIVEL': 'nivel',
          'SECCIÓN': 'seccion',
          'CAJÓN': 'cajon',
          'NOMBRE': 'nombre',
          'GRUPO': 'grupo',
          'FABRICANTE': 'fabricante',
          'CÓDIGO': 'codigo',
          'CANTIDAD': 'cantidad',
          'PESO UNITARIO': 'pesoUnitario',
          'PESO TOTAL': 'pesoTotal',
          'DESCRIPCIÓN': 'descripcion',
          'ESTADO': 'estado'
        };
        return headerMap[header] || header;
      },
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    });
  });
}

export async function Importar(
  archivo: File,
  reportarTotal: (total: number) => void,
  reportarProgreso: (cont: number) => void,
  completar: () => void,
  reportarError: (error: string) => void
): Promise<void> {
  try {
    const data = await parsearCsv(archivo);
    reportarTotal(data.length);
    await ProcesarArchivo(data, reportarProgreso);
    completar();
  } catch (error) {
    reportarError(error as string);
  }
}

async function ProcesarArchivo(
  data: Fila[],
  reportarProgreso: (cont: number) => void
): Promise<void> {
  const globalStore = useGlobalStore();
  const ctx: ContextoImportacion = {
    grupos: globalStore.ObtenerLista('grupos'),
    fabricantes: globalStore.ObtenerLista('fabricantes'),
    estados: globalStore.ObtenerLista('estados'),
    galponesModificados: new Set(),
  };

  for (let i = 0; i < data.length; i++) {
    const fila = data[i];
    if (!fila) continue;
    await ProcesarFila(fila, ctx);
    reportarProgreso(i + 1);
  }

  // Guardar todos los galpones que fueron modificados
  for (const galpon of globalStore.Galpones) {
    if (ctx.galponesModificados.has(galpon.id)) {
      try {
      await Actualizar(Coleccion.Galpones, galpon);
      } catch (error) {
        const mensaje = `Error al actualizar el galpón ${galpon.nombre} después de la importación:`;
        console.error(mensaje, error);
        throw mensaje;
      }
    }
  }
}

function parsearCantidadFila(valor: string): number {
  return Number(valor.replace(' Unit', '').replace(' ', '')) || 0;
}

function parsearPesoUnitarioFila(valor: string): number {
  return Number(valor.split(' ')[0]?.replace(',', '.')) || 0;
}

async function obtenerOCrearGalpon(nombre: string): Promise<Galpon> {
  try {
    const globalStore = useGlobalStore();
    const existente = globalStore.Galpones.find(g => g.nombre === nombre);
    if (existente) return existente;

    const galpon: Galpon = { id: '', nombre, descripcion: '', ordenDescendente: false, estantes: [] };
    await Crear(Coleccion.Galpones, galpon);
    globalStore.Galpones.push(galpon);
    await RegistrarHistorial(galpon.id, 'IMPORTACION [Galpon] Creado', null, nombre);
    return galpon;
  } catch (error) {
    const mensaje = `Error al obtener o crear el galpón ${nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function obtenerOCrearEstante(ctx: ContextoImportacion, galpon: Galpon, nombre: string): Promise<Estante> {
  try {
    const existente = galpon.estantes.find(e => e.nombre === nombre);
    if (existente) return existente;

    const estante: Estante = { id: crypto.randomUUID(), nombre, ordenDescendente: false, niveles: [] };
    galpon.estantes.push(estante);
    await RegistrarHistorial(estante.id, 'IMPORTACION [Estante] Creado', null, nombre);
    ctx.galponesModificados.add(galpon.id);
    return estante;
  } catch (error) {
    const mensaje = `Error al obtener o crear el estante ${nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function obtenerOCrearNivel(ctx: ContextoImportacion, galpon: Galpon, estante: Estante, nombre: string): Promise<Nivel> {
  try {
    const existente = estante.niveles.find(n => n.nombre === nombre);
    if (existente) return existente;

    const nivel: Nivel = { id: crypto.randomUUID(), nombre, ordenDescendente: false, secciones: [] };
    estante.niveles.push(nivel);
    await RegistrarHistorial(nivel.id, 'IMPORTACION [Nivel] Creado', null, nombre);
    ctx.galponesModificados.add(galpon.id);
    return nivel;
  } catch (error) {
    const mensaje = `Error al obtener o crear el nivel ${nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function obtenerOCrearSeccion(ctx: ContextoImportacion, galpon: Galpon, nivel: Nivel, nombre: string): Promise<Seccion> {
  try {
    const existente = nivel.secciones.find(s => s.nombre === nombre);
    if (existente) return existente;

    const seccion: Seccion = { id: crypto.randomUUID(), nombre, cajas: [] };
    nivel.secciones.push(seccion);
    await RegistrarHistorial(seccion.id, 'IMPORTACION [Sección] Creada', null, nombre);
    ctx.galponesModificados.add(galpon.id);
    return seccion;
  } catch (error) {
    const mensaje = `Error al obtener o crear la sección ${nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function obtenerOCrearCaja(ctx: ContextoImportacion, galpon: Galpon, seccion: Seccion, nombre: string): Promise<IdNombre> {
  try {
    const existente = seccion.cajas.find(c => c.nombre === nombre);
    if (existente) return existente;

    const caja: IdNombre = { id: crypto.randomUUID(), nombre };
    seccion.cajas.push(caja);
    await RegistrarHistorial(caja.id, 'IMPORTACION [Caja] Creada', null, `Caja ${nombre} (Sección: ${seccion.nombre})`);
    ctx.galponesModificados.add(galpon.id);
    return caja;
  } catch (error) {
    const mensaje = `Error al obtener o crear la caja ${nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function ProcesarFila(fila: Fila, ctx: ContextoImportacion): Promise<void> {
  const globalStore = useGlobalStore();
  const galpon = await obtenerOCrearGalpon(fila.galpon);
  const estante = await obtenerOCrearEstante(ctx, galpon, fila.estante);
  const nivel = await obtenerOCrearNivel(ctx, galpon, estante, fila.nivel);
  const seccion = await obtenerOCrearSeccion(ctx, galpon, nivel, fila.seccion);
  const cajon = await obtenerOCrearCaja(ctx, galpon, seccion, fila.cajon);

  const grupo = fila.grupo ? await obtenerOCrearLista(ctx.grupos, 'grupos', fila.grupo) : null;
  const fabricante = fila.fabricante ? await obtenerOCrearLista(ctx.fabricantes, 'fabricantes', fila.fabricante) : null;
  const estado = fila.estado ? await obtenerOCrearLista(ctx.estados, 'estados', fila.estado) : null;

  if (fila.nombre.trim() === '') {
    console.warn(`La fila con cajón '${fila.cajon}' no tiene un nombre de producto. Se omitirá esta fila.`);
    return;
  }
  const producto = await obtenerOCrearProducto(fila, grupo?.id ?? null, fabricante?.id ?? null, estado?.id ?? null, globalStore.Productos);
  await crearOActualizarCantidades(fila.cantidad, cajon, producto);
}

async function crearOActualizarCantidades(cantidadFila: string, cajon: IdNombre, producto: Producto) {
  try {
    const globalStore = useGlobalStore();
    const cantidad = parsearCantidadFila(cantidadFila);
    let itemCantidad = globalStore.Cantidades.find(c => c.cajaId === cajon.id && c.productoId === producto.id);

    if (!itemCantidad) {
      itemCantidad = {
        id: '',
        productoId: producto.id,
        cantidad,
        cajaId: cajon.id,
      };
      await Crear(Coleccion.Cantidades, itemCantidad);
      globalStore.Cantidades.push(itemCantidad);
      await RegistrarHistorial(producto.id, 'IMPORTACION [Cantidad] Creada', null, `'${producto.nombre}' agregado a caja: ${cajon.nombre} (${cantidad} unidades)`);
    } else {
      const cantidadAnterior = itemCantidad.cantidad;
      itemCantidad.cantidad = cantidad;
      await Actualizar(Coleccion.Cantidades, itemCantidad);
      await RegistrarHistorial(producto.id, 'IMPORTACION [Cantidad] Actualizada', `'${producto.nombre}' en Caja: ${cajon.nombre} (${cantidadAnterior} unidades)`, `A ${cantidad} unidades`);
    }
  } catch (error) {
    const mensaje = `Error al crear o actualizar las cantidades para el producto ${producto.nombre} en la caja ${cajon.nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function obtenerOCrearLista(
  lista: Lista[],
  tipo: Lista['tipo'],
  nombre: string
): Promise<Lista> {
  nombre = nombre.trim();
  try {
    const existente = lista.find((x) => x.nombre === nombre);
    if (existente) return existente;

    const globalStore = useGlobalStore();
    const item: Lista = { id: '', tipo, nombre };
    await Crear(Coleccion.Listas, item);
    globalStore.Listas.push(item);
    lista.push(item);
    const etiqueta = tipo === 'grupos' ? 'Grupo' : tipo === 'fabricantes' ? 'Fabricante' : 'Almacenista';
    await RegistrarHistorial(item.id, `IMPORTACION [${etiqueta}] Creado`, null, nombre);
    return item;
  } catch (error) {
    const mensaje = `Error al obtener o crear la lista de tipo ${tipo}, nombre ${nombre}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

async function obtenerOCrearProducto(
  fila: Fila,
  grupoId: string | null,
  fabricanteId: string | null,
  estadoId: string | null,
  productos: Producto[]
): Promise<Producto> {
  try {
  const existente = productos.find(
    (p) => p.nombre === fila.nombre && p.codigo === fila.codigo
  );
  if (existente) return existente;

  const producto: Producto = {
    id: '',
    nombre: fila.nombre,
    codigo: fila.codigo || null,
    descripcion: fila.descripcion || null,
    pesoUnitario: parsearPesoUnitarioFila(fila.pesoUnitario),
    grupoId: grupoId,
    fabricanteId: fabricanteId,
    imagenUrl: null,
    estadoId: estadoId,
  };
  await Crear(Coleccion.Productos, producto);
  productos.push(producto);
  const productoDesc = `Nombre: ${producto.nombre} | Código: ${producto.codigo} | Grupo: ${fila.grupo} | Fabricante: ${fila.fabricante} | Descripción: ${producto.descripcion} | Peso Unitario: ${producto.pesoUnitario} Kg`;
  await RegistrarHistorial(producto.id, 'IMPORTACION [Producto] Creado', null, productoDesc);
  return producto;
  } catch (error) {
    const mensaje = `Error al obtener o crear el producto ${fila.nombre} con código ${fila.codigo}:`;
    console.error(mensaje, error);
    throw mensaje;
  }
}

function obtenerRutaCajon(cajonId: string, galpones: Galpon[]): { galpon: string; estante: string; nivel: string; seccion: string; cajon: string } | null {
  for (const galpon of galpones) {
    for (const estante of galpon.estantes) {
      for (const nivel of estante.niveles) {
        for (const seccion of nivel.secciones) {
          const caja = seccion.cajas.find(c => c.id === cajonId);
          if (caja) {
            return { galpon: galpon.nombre, estante: estante.nombre, nivel: nivel.nombre, seccion: seccion.nombre, cajon: caja.nombre };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Genera un CSV con todas las cantidades (producto + ubicación) en el mismo formato Fila que usa Importar.
 * Cada fila es un producto en un cajón; si un producto está en varios cajones, se exporta una fila por cada uno.
 */
export async function Exportar(): Promise<string> {
  const globalStore = useGlobalStore();
  const productoPorId = Object.fromEntries(globalStore.Productos.map(p => [p.id, p]));

  const filas: Fila[] = [];

  for (const c of globalStore.Cantidades) {
    const cajonId = typeof c.cajaId === 'string' ? c.cajaId : (c.cajaId as unknown as string);
    const productoId = typeof c.productoId === 'string' ? c.productoId : (c.productoId as Producto).id;
    const ruta = obtenerRutaCajon(cajonId, globalStore.Galpones);
    const producto = productoPorId[productoId];
    if (!ruta || !producto) continue;

    const cantidad = c.cantidad;
    const pesoUnitario = producto.pesoUnitario ?? 0;
    const pesoTotal = cantidad * pesoUnitario;

    filas.push({
      galpon: ruta.galpon,
      estante: ruta.estante,
      nivel: ruta.nivel,
      seccion: ruta.seccion,
      cajon: ruta.cajon,
      nombre: producto.nombre,
      grupo: producto.grupoId ? globalStore.ListasMap[producto.grupoId] || '' : '',
      fabricante: producto.fabricanteId ? globalStore.ListasMap[producto.fabricanteId] || '' : '',
      codigo: producto.codigo ?? '',
      cantidad: `${cantidad} Unit`,
      pesoUnitario: String(pesoUnitario).replace('.', ',') + ' Kg',
      pesoTotal: String(pesoTotal).replace('.', ',') + ' Kg',
      descripcion: producto.descripcion ?? '',
      estado: producto.estadoId ? globalStore.ListasMap[producto.estadoId] || '' : '',
    });
  }

  return Papa.unparse(filas, { delimiter: ';', header: true });
}

export async function ExportarHistorial(historial: Historial[]): Promise<string> {
  const filas = historial.map(x => ({ Fecha: x.fechaCreacion.toLocaleString(), Usuario: x.usuario, Accion: x.accion, Anterior: x.anterior, Actual: x.actual }));
  return Papa.unparse(filas, { delimiter: ';', header: true });
}
