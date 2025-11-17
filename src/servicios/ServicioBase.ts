import { Query, type Models } from 'appwrite';
import { tablesDB, ID } from './appwrite.ts';

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

export async function ObtenerUno<T>(tableId: string, id: string, hijos: string): Promise<T | null> {
  try {
    const respuesta = await tablesDB.getRow({
      databaseId,
      tableId,
      rowId: id,
      queries: [Query.select(['*', `${hijos}.*`])]
    });
    return respuesta as T;
  } catch (error) {
    console.error(`Error obteniendo todos el registro:${id} de la tabla "${tableId}":`, error);
    return null;
  }
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
