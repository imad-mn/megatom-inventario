import { db } from './firebase.ts';
import { collection, addDoc, doc, query, where, getDocs, setDoc, deleteDoc, type DocumentData, QueryConstraint, type FirestoreDataConverter, orderBy, limit, QueryDocumentSnapshot, startAfter, getCountFromServer, type WithFieldValue, type SnapshotOptions, Timestamp } from "firebase/firestore";
import type { ModeloBase, ConFechaCreacion, Cantidades, CantidadesConProducto, Galpon, Historial, IdNombre, Lista, Movimientos, MovimientosExtendido, Paginacion, Producto } from './modelos.ts';

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

export function ObtenerProductosPorGrupo(grupoId: string): Promise<Producto[]> {
  return ObtenerFiltroEqual<Producto>(Coleccion.Productos, 'grupoId', grupoId);
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

export async function ObtenerMovimientos(fechaDesde: Date, fechaHasta: Date): Promise<MovimientosExtendido[]> {
  const queries = [
    orderBy('fechaCreacion', 'desc'),
    where('fechaCreacion', '>=', fechaDesde),
    where('fechaCreacion', '<=', fechaHasta),
  ];
  const collRef = collection(db, Coleccion.Movimientos).withConverter(createConverterConFecha<Movimientos>());
  const movimientos = (await getDocs(query(collRef, ...queries))).docs.map(d => d.data());
  const productos = await ObtenerConQueries<Producto>(Coleccion.Productos, [where('id', 'in', movimientos.map(m => m.productoId))]);
  const productosMap = new Map(productos.map(p => [p.id, p]));

  // Extraer cajas de la jerarquía Galpon -> Estante -> Nivel -> Seccion -> Caja
  const cajaIds = new Set(movimientos.map(m => m.cajaId));
  const galpones = await ObtenerTodos<Galpon>(Coleccion.Galpones);
  const cajasMap: Map<string, IdNombre> = new Map();
  for (const galpon of galpones) {
    for (const estante of galpon.estantes) {
      for (const nivel of estante.niveles) {
        for (const seccion of nivel.secciones) {
          for (const caja of seccion.cajas) {
            if (cajaIds.has(caja.id)) {
              cajasMap.set(caja.id, caja);
            }
          }
        }
      }
    }
  }

  const almacenistasMap = new Map(ObtenerLista('almacenistas').map(a => [a.id, a]));

  return movimientos.map(movimiento => ({
    ...movimiento,
    producto: movimiento.productoId ? productosMap.get(movimiento.productoId) || null : null,
    caja: movimiento.cajaId ? cajasMap.get(movimiento.cajaId) || null : null,
    almacenista: movimiento.almacenistaId ? almacenistasMap.get(movimiento.almacenistaId) || null : null,
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
    actual,
    fechaCreacion: new Date(),
  };

  await CrearConFecha(Coleccion.Historial, historialEntry);
}

export async function ObtenerHistorial(lastVisibleDoc: QueryDocumentSnapshot<Historial> | null | undefined, pageSize: number, sortOrder: 1 | 0 | -1 = -1, filtros: Record<string, string | null>): Promise<Paginacion<Historial>> {
  const queries: QueryConstraint[] = [];

  for (const [key, value] of Object.entries(filtros)) {
    if (value === undefined || value === null || value === '') continue; // Ignorar filtros con valor vacio
    queries.push(where(key, '==', value));
  }

  const collRef = collection(db, Coleccion.Historial).withConverter(createConverterConFecha<Historial>());
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
  const collRef = collection(db, Coleccion.Historial).withConverter(createConverterConFecha<Historial>());
  const respuesta = await getDocs(query(collRef, where('idElemento', '==', idElemento)));
  return respuesta.docs.map(d => d.data());
}
