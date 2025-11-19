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

export type Grupo = IdNombre & { }

export type Fabricante = IdNombre & { }

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
  almacenista: Almacenista;
}

export type Almacenista = IdNombre & { }

export type IdNombre = {
  $id: string;
  nombre: string;
}
