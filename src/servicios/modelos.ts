export type Producto = {
  $id: string;
  nombre: string;
  codigo: string | null;
  descripcion: string | null;
  pesoUnitario: number | null;
  grupo: string;
  fabricante: string;
  imagenId: string | null;
}

export type Inventario = {
  $id: string;
  producto: Producto | null;
  cantidad: number | null;
  actual: string;
  padre: string | null;
}

export type Movimientos = {
  producto: Producto;
  cantidad: number;
  almacenista: Lista;
}

export type TipoLista = 'fabricantes' | 'grupos' | 'almacenistas';
export type Lista = {
  $id: string;
  tipo: TipoLista;
  nombre: string;
}

export type Grupo = Lista & { tipo: 'grupos' };
export type Fabricante = Lista & { tipo: 'fabricantes' };
export type Almacenista = Lista & { tipo: 'almacenistas' };
