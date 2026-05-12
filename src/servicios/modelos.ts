export type ModeloBase = {
  id: string;
}

export type IdNombre = ModeloBase & {
  nombre: string;
}

export type Caja = IdNombre

export type Producto = IdNombre & {
  codigo: string | null;
  descripcion: string | null;
  pesoUnitario: number;
  grupoId: string | null;
  fabricanteId: string | null;
  imagenUrl: string | null;
  fileUrl: string | null;
  estadoId: string | null;
}

export type ItemOrdenable = IdNombre & {
  ordenDescendente: boolean;
}

export type Seccion = IdNombre & {
  cajas: IdNombre[];
}

export type Nivel = ItemOrdenable & {
  nombre: string;
  secciones: Seccion[];
}

export type Estante = ItemOrdenable & {
  niveles: Nivel[];
}

export type Galpon = ItemOrdenable & {
  descripcion: string | null;
  estantes: Estante[];
}

export type Cantidades = ModeloBase & {
  productoId: string;
  cajaId: string;
  cantidad: number;
}

export type CantidadesConProducto = Cantidades & {
  producto: Producto;
}

export type ProductoConCantidad = Producto & {
  cantidad: number;
}

export type ConFechaCreacion = ModeloBase & {
  fechaCreacion: Date;
}

export type Movimientos = ConFechaCreacion & {
  productoId: string;
  cantidad: number;
  almacenistaId: string;
  justificacion: string;
  tipo: 'INGRESO' | 'EGRESO' | 'TRASLADO';
  creadoPor: string;
  cajaId: string;
  cajaIdDestino: string;
}

export type MovimientosExtendido = Movimientos & {
  producto: IdNombre | null;
  caja: string | null;
  cajaDestino: string | null;
  almacenista: IdNombre | null;
  seccionOrigen: string | null;
  seccionDestino: string | null;
}

export type TipoLista = 'fabricantes' | 'grupos' | 'almacenistas' | 'estados';
export type Lista = IdNombre & {
  tipo: TipoLista;
}

export type Historial = ConFechaCreacion & {
  idElemento: string;
  usuario: string;
  accion: string;
  anterior: string | null;
  actual: string | null;
}

export type ProductoCantidadSimple = {
    productoId: string;
    cantidad: number;
}
export type Solicitud = ConFechaCreacion & {
  solicitante: string;
  direccion: string;
  telefono: string;
  procesada: boolean;
  productosCantidad: ProductoCantidadSimple[]
}
