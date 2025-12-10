import { Query, type Models } from 'appwrite';
import { tablesDB, ID } from './appwrite.ts';
import type { Cantidades, Inventario, Lista, Producto } from './modelos.ts';

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export async function ObtenerTodos<T>(tableId: string): Promise<T[]> {
  try {
    const respuesta = await tablesDB.listRows({
      databaseId,
      tableId
    });
    return respuesta.rows as T[];
  } catch (error) {
    console.error(`Error obteniendo todos los registros de la tabla ${tableId}:`, error);
    return [];
  }
}

async function ObtenerConQuery<T>(tableId: string, queries: string[]): Promise<T[]> {
  const respuesta = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: queries
  });
  return respuesta.rows as T[];
}

async function ObtenerFiltroEqual<T>(tableId: string, columna: string, valor: string | string[] | null): Promise<T[]> {
  return ObtenerConQuery<T>(tableId, [valor == null ? Query.isNull(columna) : Query.equal(columna, valor)]);
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

export async function ObtenerLista(tipo: string): Promise<Lista[]> {
  return ObtenerFiltroEqual<Lista>('listas', 'tipo', tipo);
}

export async function ObtenerBodega(padre: string | null): Promise<Inventario[]> {
  return ObtenerFiltroEqual<Inventario>('inventario', 'padre', padre);
}

export function ObtenerContenidoEstante(estanteId: string): Promise<Inventario[]> {
  return ObtenerConQuery<Inventario>('inventario', [Query.startsWith('padre', estanteId)]);
}

export function ObtenerProductosPorGrupo(grupoId: string): Promise<Producto[]> {
  return ObtenerFiltroEqual<Producto>('productos', 'grupo', grupoId);
}

export function ObtenerCantidadesPorCajones(cajonIds: string[]): Promise<Cantidades[]> {
  return ObtenerConQuery<Cantidades>('cantidades', [Query.equal('cajon', cajonIds), Query.select(['*', 'producto.*'])]);
}
