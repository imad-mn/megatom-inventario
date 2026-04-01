import Papa from 'papaparse';
import { Actualizar, Crear, ObtenerTodos, RegistrarHistorial } from './TablesDbService';
import type { Cantidades, Historial, Inventario, Lista, Producto, TipoInventario } from './modelos';
import { Inventarios, Listas } from './shared';

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
    productos: await ObtenerTodos<Producto>('productos'),
    grupos: Listas.value.filter((l) => l.tipo === 'grupos'),
    fabricantes: Listas.value.filter((l) => l.tipo === 'fabricantes'),
    cantidades: await ObtenerTodos<Cantidades>('cantidades'),
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
}

async function obtenerOCrearNodoInventario(
  tipo: TipoInventario,
  nombre: string,
  padreId: string | null
): Promise<Inventario> {
  const inventarios = Inventarios.value;
  const existente = inventarios.find(
    (x) => x.nombre === nombre && x.padre === padreId
  );
  if (existente) return existente;

  const nodo: Inventario = {
    id: '',
    tipo,
    nombre,
    padre: padreId,
    ordenDescendente: false,
  };
  await Crear('inventario', nodo);
  inventarios.push(nodo);
  await RegistrarHistorial(nodo.id, `[${tipo}] Creado`, null, nombre);
  return nodo;
}

function parsearCantidadFila(valor: string): number {
  return Number(valor.replace(' Unit', '').replace(' ', '')) || 0;
}

function parsearPesoUnitarioFila(valor: string): number {
  return Number(valor.split(' ')[0]?.replace(',', '.')) || 0;
}

async function ProcesarFila(fila: Fila, ctx: ContextoImportacion): Promise<void> {
  const galpon = await obtenerOCrearNodoInventario('Galpon', fila.galpon, null);
  const estante = await obtenerOCrearNodoInventario('Estante', fila.estante, galpon.id);
  const nivel = await obtenerOCrearNodoInventario('Nivel', fila.nivel, estante.id);
  const seccion = await obtenerOCrearNodoInventario('Sección', fila.seccion, nivel.id);
  const cajon = await obtenerOCrearNodoInventario('Caja', fila.cajon, seccion.id);

  const grupo = await obtenerOCrearLista(ctx.grupos, 'grupos', fila.grupo);
  const fabricante = await obtenerOCrearLista(ctx.fabricantes, 'fabricantes', fila.fabricante);

  const producto = await obtenerOCrearProducto(fila, grupo.id, fabricante.id, ctx.productos);

  const cantidad = parsearCantidadFila(fila.cantidad);
  const itemCantidad = ctx.cantidades.find(
    (c) => c.cajaId === cajon.id && (c.productoId as string) === producto.id
  );

  if (!itemCantidad) {
    const nuevo: Cantidades = {
      id: '',
      productoId: producto.id,
      cantidad,
      cajaId: cajon.id,
    };
    await Crear('cantidades', nuevo);
    ctx.cantidades.push(nuevo);
    await RegistrarHistorial(producto.id, `[Importación] '${producto.nombre}' agregado a caja: ${cajon.nombre} (${cantidad} unidades)`, null, `${cantidad} unidades`);
  } else {
    const cantidadAnterior = itemCantidad.cantidad;
    itemCantidad.cantidad = cantidad;
    await Actualizar('cantidades', itemCantidad);
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
  await Crear('listas', item);
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
  await Crear('productos', producto);
  productos.push(producto);
  const productoDesc = `Nombre: ${producto.nombre} | Código: ${producto.codigo} | Grupo: ${fila.grupo} | Fabricante: ${fila.fabricante} | Descripción: ${producto.descripcion} | Peso Unitario: ${producto.pesoUnitario} Kg`;
  await RegistrarHistorial(producto.id, '[Producto] Creado', null, productoDesc);
  return producto;
}

function obtenerRutaCajon(cajonId: string, inventarios: Inventario[]): { galpon: string; estante: string; nivel: string; seccion: string; cajon: string } | null {
  const cajon = inventarios.find(x => x.id === cajonId);
  if (!cajon || cajon.tipo !== 'Caja') return null;
  const seccion = inventarios.find(x => x.id === cajon.padre);
  if (!seccion) return null;
  const nivel = inventarios.find(x => x.id === seccion.padre);
  if (!nivel) return null;
  const estante = inventarios.find(x => x.id === nivel.padre);
  if (!estante) return null;
  const galpon = inventarios.find(x => x.id === estante.padre);
  if (!galpon) return null;
  return { galpon: galpon.nombre, estante: estante.nombre, nivel: nivel.nombre, seccion: seccion.nombre, cajon: cajon.nombre };
}

/**
 * Genera un CSV con todas las cantidades (producto + ubicación) en el mismo formato Fila que usa Importar.
 * Cada fila es un producto en un cajón; si un producto está en varios cajones, se exporta una fila por cada uno.
 */
export async function Exportar(): Promise<string> {
  const [productos, cantidades, listas] = await Promise.all([
    ObtenerTodos<Producto>('productos'),
    ObtenerTodos<Cantidades>('cantidades'),
    Promise.resolve(Listas.value),
  ]);

  const grupos = listas.filter(l => l.tipo === 'grupos');
  const fabricantes = listas.filter(l => l.tipo === 'fabricantes');
  const grupoPorId = Object.fromEntries(grupos.map(x => [x.id, x.nombre]));
  const fabricantePorId = Object.fromEntries(fabricantes.map(x => [x.id, x.nombre]));
  const productoPorId = Object.fromEntries(productos.map(p => [p.id, p]));

  const inventarios = Inventarios.value;
  const filas: Fila[] = [];

  for (const c of cantidades) {
    const cajonId = typeof c.cajaId === 'string' ? c.cajaId : (c.cajaId as unknown as string);
    const productoId = typeof c.productoId === 'string' ? c.productoId : (c.productoId as Producto).id;
    const ruta = obtenerRutaCajon(cajonId, inventarios);
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
  const historial = await ObtenerTodos<Historial>('Historial');
  const filas = historial.map(x => ({ Fecha: x.fechaCreacion.toLocaleString(), Usuario: x.usuario, Accion: x.accion, Anterior: x.anterior, Actual: x.actual }))
  return Papa.unparse(filas, { delimiter: ';', header: true });
}
