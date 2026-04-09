import { db } from './firebase.ts';
import { collection, addDoc, doc, query, where, getDocs, setDoc, deleteDoc, type DocumentData, QueryConstraint, type FirestoreDataConverter, orderBy, QueryDocumentSnapshot, type WithFieldValue, type SnapshotOptions, Timestamp } from "firebase/firestore";
import type { ModeloBase, ConFechaCreacion, Cantidades, CantidadesConProducto, Historial, Lista, Movimientos, Producto } from './modelos.ts';

import { Listas, Usuario } from './shared.ts';

/** Nombres de las colecciones de Firestore */
export enum Coleccion {
  Productos = 'productos',
  Cantidades = 'cantidades',
  Galpones = 'galpones',
  Movimientos = 'movimientos',
  Historial = 'historial',
  Listas = 'listas',
}

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

export async function CrearYObtenerID<T extends ModeloBase>(collectionName: string, item: T): Promise<string> {
  const collRef = collection(db, collectionName).withConverter(createConverter<T>());
  const docRef = await addDoc(collRef, item);
  return docRef.id;
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

export async function CrearConFecha<T extends ConFechaCreacion>(collectionName: string, item: T): Promise<void> {
  const collRef = collection(db, collectionName).withConverter(createConverterConFecha<T>());
  await addDoc(collRef, item);
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

export async function ObtenerCantidadesConProductos(): Promise<CantidadesConProducto[]> {
  const cantidades = await ObtenerTodos<Cantidades>(Coleccion.Cantidades);
  const productos = await ObtenerTodos<Producto>(Coleccion.Productos);
  const productosMap = new Map(productos.map(p => [p.id, p]));

  return cantidades.map(cantidad => ({
    ...cantidad,
    producto: productosMap.get(cantidad.productoId)!
  }));
}

export function ObtenerCantidadesPorProducto(productoId: string): Promise<Cantidades[]> {
  return ObtenerFiltroEqual<Cantidades>(Coleccion.Cantidades, 'productoId', productoId);
}

export async function ObtenerConFiltroFecha<T extends ConFechaCreacion>(colleccion: Coleccion, fechaDesde: Date, fechaHasta: Date, extraQueries: QueryConstraint[]): Promise<T[]> {
  const queries: QueryConstraint[] = [
    ...extraQueries,
    where('fechaCreacion', '>=', fechaDesde),
    where('fechaCreacion', '<=', fechaHasta),
    orderBy('fechaCreacion', 'desc'),
  ];
  const collRef = collection(db, colleccion).withConverter(createConverterConFecha<T>());
  return (await getDocs(query(collRef, ...queries))).docs.map(d => d.data());
}


export async function ObtenerMovimientos(fechaDesde: Date, fechaHasta: Date): Promise<Movimientos[]> {
  return ObtenerConFiltroFecha<Movimientos>(Coleccion.Movimientos, fechaDesde, fechaHasta, []);
}

export async function RegistrarHistorial(idElemento: string, accion: string, anterior: string | null = null, actual: string | null = null): Promise<void> {
  if (!Usuario.value) return;

  const historialEntry = {
    id: '', // Firestore generará el ID automáticamente
    idElemento,
    usuario: Usuario.value.user.displayName,
    accion,
    anterior,
    actual,
    fechaCreacion: new Date(),
  };

  await CrearConFecha(Coleccion.Historial, historialEntry);
}

// Función para obtener el historial con paginación
export async function ObtenerHistorial(fechaDesde: Date, fechaHasta: Date, usuario: string | null): Promise<Historial[]> {
  const extraQueries: QueryConstraint[] = usuario ? [where('usuario', '==', usuario)] : [];
  return ObtenerConFiltroFecha<Historial>(Coleccion.Historial, fechaDesde, fechaHasta, extraQueries);
}

// Función para obtener todo el historial de un elemento específico
export async function ObtenerHistorialPorElemento(idElemento: string): Promise<Historial[]> {
  const collRef = collection(db, Coleccion.Historial).withConverter(createConverterConFecha<Historial>());
  const respuesta = await getDocs(query(collRef, where('idElemento', '==', idElemento)));
  return respuesta.docs.map(d => d.data());
}
