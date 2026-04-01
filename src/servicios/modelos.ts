import type { QueryDocumentSnapshot } from "firebase/firestore";

export type Base = {
  id: string;
}

type IdNombre = Base & {
  nombre: string;
}

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

export type Galpon = Base & {
  nombre: string;
  estantes: [{
    nombre: string;
    niveles: [{
      nombre: string;
      secciones: [{
        nombre: string;
        cajas: IdNombre[]
      }]
    }]
  }]
}

export type Cantidades = Base & {
  productoId: string;
  cajaId: string;
  cantidad: number;
}

export type CantidadesConProducto = Cantidades & {
  producto: Producto;
}

export type Movimientos = Base & {
  productoId: string;
  cantidad: number;
  almacenistaId: string;
  justificacion: string | null;
  esIngreso: boolean;
  creadoPor: string;
  cajaId: string;
  fechaCreacion: string;
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

export type Historial = Base & {
  idElemento: string;
  usuario: string;
  accion: string;
  anterior: string | null;
  actual: string | null;
  fechaCreacion: string;
}

export type Paginacion<T> = {
  total: number;
  rows: T[];
  lastVisibleDoc: QueryDocumentSnapshot<T> | null | undefined;
}
