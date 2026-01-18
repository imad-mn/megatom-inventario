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

export type Inventario = {
  $id: string;
  nombre: string;
  padre: string | null;
  nivel: number | null;
  ordenDescendente: boolean | undefined;
}

export type Cantidades = {
  $id: string;
  producto: string | Producto;
  cantidad: number;
  cajon: string;
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
