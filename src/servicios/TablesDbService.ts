import { db } from './firebase.ts';
import { collection, addDoc, doc, query, where, getDocs, setDoc, deleteDoc, type DocumentData, QueryConstraint, type FirestoreDataConverter, orderBy, limit, QueryDocumentSnapshot, startAfter, getCountFromServer } from "firebase/firestore";
import type { Base, Cantidades, CantidadesConProducto, Historial, Inventario, Lista, Movimientos, MovimientosExtendido, Paginacion, Producto } from './modelos.ts';
import type { DataTableFilterMeta, DataTableFilterMetaData } from 'primevue';
import { Inventarios, Listas, Usuario } from './shared.ts';

function makeConverter<T extends Base>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snap) => ({ id: snap.id, ...snap.data() } as T),
  };
}

export async function Crear(collectionName: string, item: DocumentData): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(makeConverter<Base>());
  await addDoc(collRef, item);
}

export async function Actualizar(collectionName: string, item: DocumentData): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(makeConverter<Base>());
  const docRef = doc(collRef, item.id!);
  await setDoc(docRef, item);
}

export async function Eliminar(collectionName: string, id: string): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(makeConverter<Base>());
  const docRef = doc(collRef, id);
  await deleteDoc(docRef);
}

export async function ObtenerTodos<T extends Base>(collectionName: string): Promise<T[]> {
  const collRef = collection(db, collectionName).withConverter(makeConverter<T>());
  const respuesta = await getDocs(collRef);
  return respuesta.docs.map(doc => doc.data());
}

async function ObtenerConQueries<T extends Base>(collectionName: string, queries: QueryConstraint[]): Promise<T[]> {
  const collRef = collection(db, collectionName).withConverter(makeConverter<T>());
  const respuesta = await getDocs(query(collRef, ...queries));
  return respuesta.docs.map(doc => doc.data());
}

async function ObtenerFiltroEqual<T extends Base>(collectionName: string, columna: string, valor: string | string[] | null): Promise<T[]> {
  return ObtenerConQueries<T>(collectionName, [where(columna, '==', valor)]);
}

export function ObtenerLista(tipo: string): Lista[] {
  return Listas.value.filter(x => x.tipo == tipo);
}

export function ObtenerProductosPorGrupo(grupoId: string): Promise<Producto[]> {
  return ObtenerFiltroEqual<Producto>('productos', 'grupoId', grupoId);
}

export async function ObtenerCantidadesConProductos(cajaIds: string[]): Promise<CantidadesConProducto[]> {
  const cantidades = await ObtenerConQueries<Cantidades>('cantidades', [where('cajaId', 'in', cajaIds)]);
  const productos = await ObtenerConQueries<Producto>('productos', [where('id', 'in', cantidades.map(c => c.productoId))]);

  return cantidades.map(cantidad => ({
    ...cantidad,
    producto: productos.find(p => p.id === cantidad.productoId)!
  }));
}

export function ObtenerCantidadesPorProducto(productoId: string): Promise<Cantidades[]> {
  return ObtenerFiltroEqual<Cantidades>('cantidades', 'productoId', productoId);
}

export async function EliminarItemInventario(item: Inventario) {
  const hijos = Inventarios.value.filter(x => x.padre === item.id);
  for (const subItem of hijos) {
    await EliminarItemInventario(subItem);
  }
  await Eliminar('inventario', item.id);
  const indice = Inventarios.value.findIndex(x => x.id === item.id);
  if (indice >= 0) Inventarios.value.splice(indice, 1);
}

export async function ObtenerMovimientos(fechaDesde: Date, fechaHasta: Date): Promise<MovimientosExtendido[]> {
  const queries = [
    orderBy('fechaCreacion', 'desc'),
    where('fechaCreacion', '>=', fechaDesde),
    where('fechaCreacion', '<=', fechaHasta),
  ];
  const movimientos = await ObtenerConQueries<Movimientos>('movimientos', queries);
  const productos = await ObtenerConQueries<Producto>('productos', [where('id', 'in', movimientos.map(m => m.productoId))]);
  const cajas = await ObtenerConQueries<Inventario>('inventario', [where('id', 'in', movimientos.map(m => m.cajaId))]);
  const almacenistas = ObtenerLista('almacenistas');

  return movimientos.map(movimiento => ({
    ...movimiento,
    producto: movimiento.productoId ? productos.find(p => p.id === movimiento.productoId) || null : null,
    caja: movimiento.cajaId ? cajas.find(c => c.id === movimiento.cajaId) || null : null,
    almacenista: movimiento.almacenistaId ? almacenistas.find(a => a.id === movimiento.almacenistaId) || null : null,
  }));
}

export async function RegistrarHistorial(idElemento: string, accion: string, anterior: string | null = null, actual: string | null = null): Promise<void> {
  if (!Usuario.value) return;

  const historialEntry = {
    idElemento,
    usuario: Usuario.value.user.displayName,
    accion,
    anterior,
    actual
  };

  await Crear('Historial', historialEntry);
}

export async function ObtenerHistorial(lastVisibleDoc: QueryDocumentSnapshot<Historial> | null | undefined, pageSize: number, sortOrder: 1 | 0 | -1 = -1, filtros: DataTableFilterMeta): Promise<Paginacion<Historial>> {
  const queries: QueryConstraint[] = [];

  for (const key in filtros) {
    const filtro = filtros[key] as DataTableFilterMetaData;
    if (filtro.value) {
      switch (filtro.matchMode) {
        case 'equals':
          queries.push(where(key, '==', filtro.value));
          break;
      }
    }
  }

  const collRef = collection(db, 'Historial').withConverter(makeConverter<Historial>());
  const snapshot = await getCountFromServer(query(collRef, ...queries));
  const totalCount = snapshot.data().count;

  queries.push(limit(pageSize));
  queries.push(sortOrder === 1 ? orderBy('fechaCreacion') : orderBy('fechaCreacion', 'desc'));
  if (lastVisibleDoc) {
    queries.push(startAfter(lastVisibleDoc));
  }

  const respuesta = await getDocs(query(collRef, ...queries));
  const rows = respuesta.docs.map(doc => doc.data() as Historial);
  const newLastVisibleDoc = respuesta.docs.length > 0 ? respuesta.docs[respuesta.docs.length - 1] : null;

  return {
    total: totalCount,
    rows,
    lastVisibleDoc: newLastVisibleDoc,
  };
}

export async function ObtenerHistorialPorElemento(idElemento: string): Promise<Historial[]> {
  return await ObtenerFiltroEqual<Historial>('Historial', 'idElemento', idElemento);
}
