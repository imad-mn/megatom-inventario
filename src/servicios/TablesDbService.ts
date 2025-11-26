import { Query, type Models } from 'appwrite';
import { tablesDB, ID } from './appwrite.ts';
import type { Inventario, Lista } from './modelos.ts';

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

async function ObtenerFiltroEqual<T>(tableId: string, columna: string, valor: string | null): Promise<T[]> {
  try {
    const respuesta = await tablesDB.listRows({
      databaseId,
      tableId,
      queries: [valor == null ? Query.isNull(columna) : Query.equal(columna, valor)]
    });
    return respuesta.rows as T[];
  } catch (error) {
    console.error(`Error obteniendo datos de la tabla ${tableId} con filtro ${columna}=${valor}:`, error);
    return [];
  }
}

async function ObtenerFiltroStartWith<T>(tableId: string, columna: string, valor: string): Promise<T[]> {
  const respuesta = await tablesDB.listRows({
    databaseId,
    tableId,
    queries: [Query.startsWith(columna, valor)]
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

export async function ObtenerLista(tipo: string): Promise<Lista[]> {
  return ObtenerFiltroEqual<Lista>('listas', 'tipo', tipo);
}

export async function ObtenerBodega(padre: string | null): Promise<Inventario[]> {
  return ObtenerFiltroEqual<Inventario>('inventario', 'padre', padre);
}

export function ObtenerContenidoEstante(estanteId: string): Promise<Inventario[]> {
  return ObtenerFiltroStartWith<Inventario>('inventario', 'padre', estanteId);
}
