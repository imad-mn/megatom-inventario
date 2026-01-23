import Papa from 'papaparse';
import { Actualizar, Crear, Inventarios, Listas, ObtenerTodos } from './TablesDbService';
import type { Cantidades, Lista, Producto } from './modelos';

type Fila = {
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
  pesoTotal: string
  descripcion: string;
};

export async function Importar(file: File, reportarTotal: (total:number) => void, reportarProgreso: (cont:number) => void, completar: () => void): Promise<void> {
  Papa.parse<Fila>(file, {
    delimiter: ';',
    header: true,
    skipEmptyLines: true,
    complete: async (result) => {
      console.log('Finalización de lectura de archivo CSV');
      reportarTotal(result.data.length);
      await ProcesarArchivo(result.data, reportarProgreso);
      completar();
    },
    error: (error) => {
      console.error('Error al leer el archivo CSV:', error);
      return;
    }
  });
}

async function ProcesarArchivo(data: Fila[], reportarProgreso: (cont:number) => void) {
  // Cargar datos existentes
  const productos = await ObtenerTodos<Producto>('productos');
  const grupos = Listas.value.filter(l => l.tipo === 'grupos');
  const fabricantes = Listas.value.filter(l => l.tipo === 'fabricantes');
  const cantidades = await ObtenerTodos<Cantidades>('cantidades');

  // Procesar los datos importados uno por uno
  for (const fila of data) {
    try {
      await ProcesarFila(fila, productos, grupos, fabricantes, cantidades);
      reportarProgreso(data.indexOf(fila) + 1);
    } catch (error) {
      console.error(`Error al procesar la fila con producto ${fila.nombre}:`, error);
    }
  }
  console.info(`Archivo importado correctamente.`);
}

async function ProcesarFila(fila: Fila, productos: Producto[], grupos: Lista[], fabricantes: Lista[], cantidades: Cantidades[]) {
  let galpon = Inventarios.value.find(x => x.nombre == fila.galpon && x.padre == null);
  if (!galpon) {
    galpon = {
      $id: '',
      tipo: 'Galpon',
      nombre: fila.galpon,
      padre: null,
      ordenDescendente: false,
    };
    await Crear('inventario', galpon);
    Inventarios.value.push(galpon);
  }

  let estante = Inventarios.value.find(x => x.nombre == fila.estante && x.padre == galpon.$id);
  if (!estante) {
    estante = {
      $id: '',
      tipo: 'Estante',
      nombre: fila.estante,
      padre: galpon.$id,
      ordenDescendente: false,
    };
    await Crear('inventario', estante);
    Inventarios.value.push(estante);
  }

  let nivel = Inventarios.value.find(x => x.nombre == fila.nivel && x.padre == estante.$id);
  if (!nivel) {
    nivel = {
      $id: '',
      tipo: 'Nivel',
      nombre: fila.nivel,
      padre: estante.$id,
      ordenDescendente: false,
    };
    await Crear('inventario', nivel);
    Inventarios.value.push(nivel);
  }

  let seccion = Inventarios.value.find(x => x.nombre == fila.seccion && x.padre == nivel.$id);
  if (!seccion) {
    seccion = {
      $id: '',
      tipo: 'Sección',
      nombre: fila.seccion,
      padre: nivel.$id,
      ordenDescendente: false,
    };
    await Crear('inventario', seccion);
    Inventarios.value.push(seccion);
  }

  let cajon = Inventarios.value.find(x => x.nombre == fila.cajon && x.padre == seccion.$id);
  if (!cajon) {
    cajon = {
      $id: '',
      tipo: 'Caja',
      nombre: fila.cajon,
      padre: seccion.$id,
      ordenDescendente: false,
    };
    await Crear('inventario', cajon);
    Inventarios.value.push(cajon);
  }

  let grupo = grupos.find(g => g.nombre == fila.grupo);
  if (!grupo) {
    grupo = {$id: '', tipo: 'grupos', nombre: fila.grupo };
    await Crear('listas', grupo);
    Listas.value.push(grupo);
  }

  let fabricante = fabricantes.find(f => f.nombre == fila.fabricante);
  if (!fabricante) {
    fabricante = { $id: '', tipo: 'fabricantes', nombre: fila.fabricante };
    await Crear('listas', fabricante);
    Listas.value.push(fabricante);
  }

  let producto = productos.find(p => p.nombre == fila.nombre && p.codigo == fila.codigo);
  if (!producto) {
    producto = {
      $id: '',
      nombre: fila.nombre,
      codigo: fila.codigo || null,
      descripcion: fila.descripcion || null,
      pesoUnitario: Number(fila.pesoUnitario.split(' ')[0]?.replace(',', '.')) || 0,
      grupo: grupo.$id,
      fabricante: fabricante.$id,
      imagenId: null,
    };
    await Crear('productos', producto);
    productos.push(producto);
  }

  let itemCantidad = cantidades.find(c => c.cajon == cajon!.$id && (c.producto as string) == producto!.$id);
  const cantidad = Number(fila.cantidad.replace(' Unit', '').replace(' ','')) || 0;
  if (!itemCantidad) {
    itemCantidad = {
      $id: '',
      producto: producto.$id,
      cantidad: cantidad,
      cajon: cajon.$id,
    };
    await Crear('cantidades', itemCantidad);
    cantidades.push(itemCantidad);
  }
  else {
    itemCantidad.cantidad = cantidad;
    await Actualizar('cantidades', itemCantidad);
  }
}

