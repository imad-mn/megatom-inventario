import type { Models } from "appwrite";

export type Producto = {
  $id: string;
  nombre: string;
  codigo: string | null;
  descripcion: string | null;
  pesoUnitario: number;
  grupo: string;
  fabricante: string;
  imagenId: string | null;
}
export type TipoInventario = 'Galpon' | 'Estante' | 'Nivel' | 'Sección' | 'Caja';
export type Inventario = {
  $id: string;
  tipo: TipoInventario;
  nombre: string;
  padre: string | null;
  ordenDescendente: boolean;
}

export type Cantidades = {
  $id: string;
  producto: string;
  cantidad: number;
  cajon: string;
}

export type CantidadesConProducto = Omit<Cantidades, 'producto'> & {
  producto: Producto;
}

export type CajasConCantidad = {
  $id: string;
  nombre: string;
  cantidad: number;
}

export type Movimientos = {
  $id: string;
  producto: string | null;
  cantidad: number;
  almacenista: string | null;
  justificacion: string | null;
  esIngreso: boolean;
  creadoPor: string;
  caja: string | null;
  $createdAt: string;
}

export type TipoLista = 'fabricantes' | 'grupos' | 'almacenistas' | 'usuario';
export type Lista = {
  $id: string;
  tipo: TipoLista;
  nombre: string;
}

export type Historial = Models.Row & {
  idElemento: string;
  usuario: string;
  accion: string;
  anterior: string | null;
  actual: string | null;
}
