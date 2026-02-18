import { Query, type Models } from 'appwrite';
import { tablesDB, ID } from './appwrite.ts';
import type { Cantidades, CantidadesConProducto, Inventario, Lista, Producto } from './modelos.ts';
import { ref } from 'vue';

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export const Inventarios = ref<Inventario[]>([]);
export const Listas = ref<Lista[]>([]);

export async function ObtenerTodos<T>(tableId: string): Promise<T[]> {
  const respuesta = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.limit(1000)]
  });
  return respuesta.rows as T[];
}

async function ObtenerConQuery<T>(tableId: string, queries: string[]): Promise<T[]> {
  const respuesta = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: queries
  });
  return respuesta.rows as T[];
}

export async function Crear(tableId: string, item: Partial<Models.Row> & Record<string, unknown>): Promise<void> {
  item.$id = ID.unique();
  await tablesDB.createRow({
    databaseId,
    tableId,
    rowId: item.$id,
    data: item,
  });
}

export async function Actualizar(tableId: string, item: Partial<Models.Row> & Record<string, unknown>): Promise<void> {
  await tablesDB.updateRow({
    databaseId,
    tableId,
    rowId: item.$id ?? ID.unique(),
    data: item,
  });
}

export async function Eliminar(tableId: string, id: string): Promise<void> {
  await tablesDB.deleteRow({
    databaseId,
    tableId,
    rowId: id,
  });
}

async function ObtenerFiltroEqual<T>(tableId: string, columna: string, valor: string | string[] | null): Promise<T[]> {
  return ObtenerConQuery<T>(tableId, [valor == null ? Query.isNull(columna) : Query.equal(columna, valor)]);
}

export function ObtenerLista(tipo: string): Lista[] {
  return Listas.value.filter(x => x.tipo == tipo);
}

export function ObtenerProductosPorGrupo(grupoId: string): Promise<Producto[]> {
  return ObtenerFiltroEqual<Producto>('productos', 'grupo', grupoId);
}

export function ObtenerCantidadesConProductos(): Promise<CantidadesConProducto[]> {
  return ObtenerConQuery<CantidadesConProducto>('cantidades', [Query.select(['*', 'producto.*']), Query.limit(1000)]);
}

export function ObtenerCantidadesPorProducto(productoId: string): Promise<Cantidades[]> {
  return ObtenerFiltroEqual<Cantidades>('cantidades', 'producto', productoId);
}

export async function EliminarItemInventario(item: Inventario) {
  const hijos = Inventarios.value.filter(x => x.padre === item.$id);
  for (const subItem of hijos) {
    await EliminarItemInventario(subItem);
  }
  await Eliminar('inventario', item.$id);
  const indice = Inventarios.value.findIndex(x => x.$id === item.$id);
  if (indice >= 0) Inventarios.value.splice(indice, 1);
}
