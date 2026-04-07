import Papa from 'papaparse';
import { Actualizar, Coleccion, Crear, CrearYObtenerID, ObtenerTodos, RegistrarHistorial } from './TablesDbService';
import type { Cantidades, Estante, Galpon, Historial, IdNombre, Lista, Nivel, Producto, Seccion } from './modelos';
import { Listas } from './shared';

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
};

/** Contexto compartido durante la importación: datos ya cargados y mutables para ir agregando nuevos. */
interface ContextoImportacion {
  productos: Producto[];
  grupos: Lista[];
  fabricantes: Lista[];
  cantidades: Cantidades[];
  galpones: Galpon[];
  galponesModificados: Set<string>;
}

function parsearCsv(file: File): Promise<Fila[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Fila>(file, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (result) => resolve(result.data),
      error: (err) => reject(err),
    });
  });
}

export async function Importar(
  file: File,
  reportarTotal: (total: number) => void,
  reportarProgreso: (cont: number) => void,
  completar: () => void
): Promise<void> {
  try {
    const data = await parsearCsv(file);
    reportarTotal(data.length);
    await ProcesarArchivo(data, reportarProgreso);
    completar();
  } catch (error) {
    console.error('Error al importar el archivo CSV:', error);
    completar();
  }
}

async function ProcesarArchivo(
  data: Fila[],
  reportarProgreso: (cont: number) => void
): Promise<void> {
  const ctx: ContextoImportacion = {
    productos: await ObtenerTodos<Producto>(Coleccion.Productos),
    grupos: Listas.value.filter((l) => l.tipo === 'grupos'),
    fabricantes: Listas.value.filter((l) => l.tipo === 'fabricantes'),
    cantidades: await ObtenerTodos<Cantidades>(Coleccion.Cantidades),
    galpones: await ObtenerTodos<Galpon>(Coleccion.Galpones),
    galponesModificados: new Set(),
  };

  for (let i = 0; i < data.length; i++) {
    const fila = data[i];
    if (!fila) continue;
    try {
      await ProcesarFila(fila, ctx);
    } catch (error) {
      console.error(`Error al procesar la fila con producto "${fila.nombre}":`, error);
    }
    reportarProgreso(i + 1);
  }

  // Guardar todos los galpones que fueron modificados
  for (const galpon of ctx.galpones) {
    if (ctx.galponesModificados.has(galpon.id)) {
      await Actualizar(Coleccion.Galpones, galpon);
    }
  }
}

function parsearCantidadFila(valor: string): number {
  return Number(valor.replace(' Unit', '').replace(' ', '')) || 0;
}

function parsearPesoUnitarioFila(valor: string): number {
  return Number(valor.split(' ')[0]?.replace(',', '.')) || 0;
}

async function obtenerOCrearGalpon(ctx: ContextoImportacion, nombre: string): Promise<Galpon> {
  const existente = ctx.galpones.find(g => g.nombre === nombre);
  if (existente) return existente;

  const galpon: Galpon = { id: '', nombre, ordenDescendente: false, estantes: [] };
  galpon.id = await CrearYObtenerID(Coleccion.Galpones, galpon);
  ctx.galpones.push(galpon);
  await RegistrarHistorial(galpon.id, '[Galpon] Creado', null, nombre);
  return galpon;
}

function obtenerOCrearEstante(ctx: ContextoImportacion, galpon: Galpon, nombre: string): Estante {
  const existente = galpon.estantes.find(e => e.nombre === nombre);
  if (existente) return existente;

  const estante: Estante = { id: crypto.randomUUID(), nombre, ordenDescendente: false, niveles: [] };
  galpon.estantes.push(estante);
  ctx.galponesModificados.add(galpon.id);
  return estante;
}

function obtenerOCrearNivel(ctx: ContextoImportacion, galpon: Galpon, estante: Estante, nombre: string): Nivel {
  const existente = estante.niveles.find(n => n.nombre === nombre);
  if (existente) return existente;

  const nivel: Nivel = { id: crypto.randomUUID(), nombre, ordenDescendente: false, secciones: [] };
  estante.niveles.push(nivel);
  ctx.galponesModificados.add(galpon.id);
  return nivel;
}

function obtenerOCrearSeccion(ctx: ContextoImportacion, galpon: Galpon, nivel: Nivel, nombre: string): Seccion {
  const existente = nivel.secciones.find(s => s.nombre === nombre);
  if (existente) return existente;

  const seccion: Seccion = { id: crypto.randomUUID(), nombre, cajas: [] };
  nivel.secciones.push(seccion);
  ctx.galponesModificados.add(galpon.id);
  return seccion;
}

function obtenerOCrearCaja(ctx: ContextoImportacion, galpon: Galpon, seccion: Seccion, nombre: string): IdNombre {
  const existente = seccion.cajas.find(c => c.nombre === nombre);
  if (existente) return existente;

  const caja: IdNombre = { id: crypto.randomUUID(), nombre };
  seccion.cajas.push(caja);
  ctx.galponesModificados.add(galpon.id);
  return caja;
}

async function ProcesarFila(fila: Fila, ctx: ContextoImportacion): Promise<void> {
  const galpon = await obtenerOCrearGalpon(ctx, fila.galpon);
  const estante = obtenerOCrearEstante(ctx, galpon, fila.estante);
  const nivel = obtenerOCrearNivel(ctx, galpon, estante, fila.nivel);
  const seccion = obtenerOCrearSeccion(ctx, galpon, nivel, fila.seccion);
  const cajon = obtenerOCrearCaja(ctx, galpon, seccion, fila.cajon);

  const grupo = await obtenerOCrearLista(ctx.grupos, 'grupos', fila.grupo);
  const fabricante = await obtenerOCrearLista(ctx.fabricantes, 'fabricantes', fila.fabricante);

  const producto = await obtenerOCrearProducto(fila, grupo.id, fabricante.id, ctx.productos);

  const cantidad = parsearCantidadFila(fila.cantidad);
  const itemCantidad = ctx.cantidades.find(
    (c) => c.cajaId === cajon.id && c.productoId === producto.id
  );

  if (!itemCantidad) {
    const nuevo: Cantidades = {
      id: '',
      productoId: producto.id,
      cantidad,
      cajaId: cajon.id,
    };
    await Crear(Coleccion.Cantidades, nuevo);
    ctx.cantidades.push(nuevo);
    await RegistrarHistorial(producto.id, `[Importación] '${producto.nombre}' agregado a caja: ${cajon.nombre} (${cantidad} unidades)`, null, `${cantidad} unidades`);
  } else {
    const cantidadAnterior = itemCantidad.cantidad;
    itemCantidad.cantidad = cantidad;
    await Actualizar(Coleccion.Cantidades, itemCantidad);
    await RegistrarHistorial(producto.id, `[Importación] Cantidad actualizada en caja ${cajon.nombre}`, String(cantidadAnterior), String(cantidad));
  }
}

async function obtenerOCrearLista(
  lista: Lista[],
  tipo: Lista['tipo'],
  nombre: string
): Promise<Lista> {
  const existente = lista.find((x) => x.nombre === nombre);
  if (existente) return existente;

  const item: Lista = { id: '', tipo, nombre };
  await Crear(Coleccion.Listas, item);
  Listas.value.push(item);
  lista.push(item);
  const etiqueta = tipo === 'grupos' ? 'Grupo' : tipo === 'fabricantes' ? 'Fabricante' : 'Almacenista';
  await RegistrarHistorial(item.id, `[${etiqueta}] Creado`, null, nombre);
  return item;
}

async function obtenerOCrearProducto(
  fila: Fila,
  grupoId: string,
  fabricanteId: string,
  productos: Producto[]
): Promise<Producto> {
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
    imagenId: null,
  };
  await Crear(Coleccion.Productos, producto);
  productos.push(producto);
  const productoDesc = `Nombre: ${producto.nombre} | Código: ${producto.codigo} | Grupo: ${fila.grupo} | Fabricante: ${fila.fabricante} | Descripción: ${producto.descripcion} | Peso Unitario: ${producto.pesoUnitario} Kg`;
  await RegistrarHistorial(producto.id, '[Producto] Creado', null, productoDesc);
  return producto;
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
  const [productos, cantidades, galpones] = await Promise.all([
    ObtenerTodos<Producto>(Coleccion.Productos),
    ObtenerTodos<Cantidades>(Coleccion.Cantidades),
    ObtenerTodos<Galpon>(Coleccion.Galpones),
  ]);

  const grupos = Listas.value.filter(l => l.tipo === 'grupos');
  const fabricantes = Listas.value.filter(l => l.tipo === 'fabricantes');
  const grupoPorId = Object.fromEntries(grupos.map(x => [x.id, x.nombre]));
  const fabricantePorId = Object.fromEntries(fabricantes.map(x => [x.id, x.nombre]));
  const productoPorId = Object.fromEntries(productos.map(p => [p.id, p]));

  const filas: Fila[] = [];

  for (const c of cantidades) {
    const cajonId = typeof c.cajaId === 'string' ? c.cajaId : (c.cajaId as unknown as string);
    const productoId = typeof c.productoId === 'string' ? c.productoId : (c.productoId as Producto).id;
    const ruta = obtenerRutaCajon(cajonId, galpones);
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
      grupo: grupoPorId[producto.grupoId] ?? '',
      fabricante: fabricantePorId[producto.fabricanteId] ?? '',
      codigo: producto.codigo ?? '',
      cantidad: `${cantidad} Unit`,
      pesoUnitario: String(pesoUnitario).replace('.', ',') + ' Kg',
      pesoTotal: String(pesoTotal).replace('.', ',') + ' Kg',
      descripcion: producto.descripcion ?? '',
    });
  }

  return Papa.unparse(filas, { delimiter: ';', header: true });
}

export async function ExportarHistorial(): Promise<string> {
  const historial = await ObtenerTodos<Historial>(Coleccion.Historial);
  const filas = historial.map(x => ({ Fecha: x.fechaCreacion.toLocaleString(), Usuario: x.usuario, Accion: x.accion, Anterior: x.anterior, Actual: x.actual }));
  return Papa.unparse(filas, { delimiter: ';', header: true });
}
