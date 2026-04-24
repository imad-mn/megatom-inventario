import { db } from './firebase.ts';
import { collection, addDoc, doc, query, where, getDocs, setDoc, deleteDoc, type DocumentData, QueryConstraint, type FirestoreDataConverter, orderBy, QueryDocumentSnapshot, type WithFieldValue, type SnapshotOptions, Timestamp } from "firebase/firestore";
import type { ModeloBase, ConFechaCreacion } from './modelos.ts';

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
export function createConverterConFecha<T extends ConFechaCreacion>(): FirestoreDataConverter<T> {
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
  const docRef = await addDoc(collRef, item);
  item.id = docRef.id;
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
