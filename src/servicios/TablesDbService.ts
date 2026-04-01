import { db } from './firebase.ts';
import { collection, addDoc, doc, query, where, getDocs, setDoc, deleteDoc, type DocumentData, QueryConstraint, type FirestoreDataConverter, orderBy, limit, QueryDocumentSnapshot, startAfter, getCountFromServer, type WithFieldValue, type SnapshotOptions, Timestamp } from "firebase/firestore";
import type { ModeloBase, ConFechaCreacion, Cantidades, CantidadesConProducto, Historial, Inventario, Lista, Movimientos, MovimientosExtendido, Paginacion, Producto } from './modelos.ts';

import { Inventarios, Listas, Usuario } from './shared.ts';

/**
 * Crea un FirestoreDataConverter genérico para cualquier tipo T que extienda ModeloBase.
 * Elimina el campo `id` al escribir (Firestore lo maneja como ID del documento)
 * y lo restaura al leer desde el snapshot.
 */
function createConverter<T extends ModeloBase>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: WithFieldValue<T>): DocumentData {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...data } = model as WithFieldValue<T> & { id?: unknown };
      return data as DocumentData;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      return { id: snap.id, ...snap.data(options) } as T;
    },
  };
}

/**
 * Converter genérico para modelos con campo `fechaCreacion`.
 * Al escribir convierte `Date` → `Timestamp` de Firestore.
 * Al leer convierte `Timestamp` → `Date`.
 */
function createConverterConFecha<T extends ConFechaCreacion>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: WithFieldValue<T>): DocumentData {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, fechaCreacion, ...rest } = model as WithFieldValue<T> & { id?: unknown; fechaCreacion?: Date };
      return {
        ...rest,
        fechaCreacion: fechaCreacion instanceof Date ? Timestamp.fromDate(fechaCreacion) : fechaCreacion,
      } as DocumentData;
    },
    fromFirestore(snap: QueryDocumentSnapshot, options?: SnapshotOptions): T {
      const { fechaCreacion, ...rest } = snap.data(options);
      return {
        id: snap.id,
        ...rest,
        fechaCreacion: fechaCreacion instanceof Timestamp ? fechaCreacion.toDate() : fechaCreacion,
      } as T;
    },
  };
}

export async function Crear<T extends ModeloBase>(collectionName: string, item: T): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(createConverter<T>());
  await addDoc(collRef, item);
}

export async function Actualizar<T extends ModeloBase>(collectionName: string, item: T): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(createConverter<T>());
  const docRef = doc(collRef, item.id);
  await setDoc(docRef, item);
}

export async function Eliminar<T extends ModeloBase>(collectionName: string, item: T): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(createConverter<T>());
  const docRef = doc(collRef, item.id);
  await deleteDoc(docRef);
}

export async function ObtenerTodos<T extends ModeloBase>(collectionName: string): Promise<T[]> {
  const collRef = collection(db, collectionName).withConverter(createConverter<T>());
  const respuesta = await getDocs(collRef);
  return respuesta.docs.map(doc => doc.data());
}

async function ObtenerConQueries<T extends ModeloBase>(collectionName: string, queries: QueryConstraint[]): Promise<T[]> {
  const collRef = collection(db, collectionName).withConverter(createConverter<T>());
  const respuesta = await getDocs(query(collRef, ...queries));
  return respuesta.docs.map(doc => doc.data());
}

async function ObtenerFiltroEqual<T extends ModeloBase>(collectionName: string, columna: string, valor: string | null): Promise<T[]> {
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
  await Eliminar('inventario', item);
  const indice = Inventarios.value.findIndex(x => x.id === item.id);
  if (indice >= 0) Inventarios.value.splice(indice, 1);
}

export async function ObtenerMovimientos(fechaDesde: Date, fechaHasta: Date): Promise<MovimientosExtendido[]> {
  const queries = [
    orderBy('fechaCreacion', 'desc'),
    where('fechaCreacion', '>=', fechaDesde),
    where('fechaCreacion', '<=', fechaHasta),
  ];
  const collRef = collection(db, 'movimientos').withConverter(createConverterConFecha<Movimientos>());
  const movimientos = (await getDocs(query(collRef, ...queries))).docs.map(d => d.data());
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
    id: '', // Firestore generará el ID automáticamente
    idElemento,
    usuario: Usuario.value.user.displayName,
    accion,
    anterior,
    actual
  };

  await Crear('Historial', historialEntry);
}

export async function ObtenerHistorial(lastVisibleDoc: QueryDocumentSnapshot<Historial> | null | undefined, pageSize: number, sortOrder: 1 | 0 | -1 = -1, filtros: Record<string, string | null>): Promise<Paginacion<Historial>> {
  const queries: QueryConstraint[] = [];

  for (const [key, value] of Object.entries(filtros)) {
    queries.push(where(key, '==', value));
  }

  const collRef = collection(db, 'Historial').withConverter(createConverterConFecha<Historial>());
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
  const collRef = collection(db, 'Historial').withConverter(createConverterConFecha<Historial>());
  const respuesta = await getDocs(query(collRef, where('idElemento', '==', idElemento)));
  return respuesta.docs.map(d => d.data());
}
