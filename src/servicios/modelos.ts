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

export type Movimientos = {
  $id: string;
  producto: Producto;
  cantidad: number;
  almacenista: Lista;
  justificacion: string | null;
  creadoPor: string;
  $createdAt: Date;
}

export type TipoLista = 'fabricantes' | 'grupos' | 'almacenistas';
export type Lista = {
  $id: string;
  tipo: TipoLista;
  nombre: string;
}
