import type { QueryDocumentSnapshot } from "firebase/firestore";

export type ModeloBase = {
  id: string;
}

type IdNombre = ModeloBase & {
  nombre: string;
}

export type Caja = IdNombre

export type Producto = IdNombre & {
  codigo: string | null;
  descripcion: string | null;
  pesoUnitario: number;
  grupoId: string;
  fabricanteId: string;
  imagenId: string | null;
}

export type TipoInventario = 'Galpon' | 'Estante' | 'Nivel' | 'Sección' | 'Caja';
export type Inventario = IdNombre & {
  tipo: TipoInventario;
  padre: string | null;
  ordenDescendente: boolean;
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

export type ConFechaCreacion = ModeloBase & {
  fechaCreacion: Date;
}

export type Movimientos = ConFechaCreacion & {
  productoId: string;
  cantidad: number;
  almacenistaId: string;
  justificacion: string | null;
  esIngreso: boolean;
  creadoPor: string;
  cajaId: string;
}

export type MovimientosExtendido = Movimientos & {
  producto: IdNombre | null;
  caja: IdNombre | null;
  almacenista: IdNombre | null;
}

export type TipoLista = 'fabricantes' | 'grupos' | 'almacenistas' | 'usuario';
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

export type Paginacion<T> = {
  total: number;
  rows: T[];
  lastVisibleDoc: QueryDocumentSnapshot<T> | null | undefined;
}
