import { collection, getDocs, query, where, type QueryConstraint } from "firebase/firestore";
import { useAuthStore } from "./authStore";
import { Coleccion, CrearConFecha, createConverterConFecha, ObtenerConFiltroFecha } from "./TablesDbService";
import type { Historial, Producto } from "./modelos";
import { db } from "./firebase";
import { useGlobalStore } from "./globalStore";

export async function RegistrarHistorial(idElemento: string, accion: string, anterior: string | null = null, actual: string | null = null): Promise<void> {
  const { Usuario } = useAuthStore();
  if (!Usuario) return;

  const historialEntry = {
    id: '', // Firestore generará el ID automáticamente
    idElemento,
    usuario: Usuario.user.displayName,
    accion,
    anterior,
    actual,
    fechaCreacion: new Date(),
  };

  await CrearConFecha(Coleccion.Historial, historialEntry);
}

// Función para obtener el historial por rango de fechas y opcionalmente por usuario
export async function ObtenerHistorial(fechaDesde: Date, fechaHasta: Date, usuario: string | null): Promise<Historial[]> {
  const extraQueries: QueryConstraint[] = usuario ? [where('usuario', '==', usuario)] : [];
  return ObtenerConFiltroFecha<Historial>(Coleccion.Historial, fechaDesde, fechaHasta, extraQueries);
}

// Función para obtener todo el historial de un elemento específico
export async function ObtenerHistorialPorElemento(idElemento: string): Promise<Historial[]> {
  const collRef = collection(db, Coleccion.Historial).withConverter(createConverterConFecha<Historial>());
  const respuesta = await getDocs(query(collRef, where('idElemento', '==', idElemento)));
  return respuesta.docs.map(d => d.data()).sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
}

export function Stringify(item: Producto): string {
  const globalStore = useGlobalStore();
  return `Nombre: ${item.nombre} | Código: ${item.codigo} | Grupo: ${item.grupoId ? globalStore.ListasMap[item.grupoId] || '' : ''} | Fabricante: ${item.fabricanteId ? globalStore.ListasMap[item.fabricanteId] || '' : ''} | Descripción: ${item.descripcion} | Peso Unitario: ${item.pesoUnitario} Kg`;
}

export async function RegistrarCambioProducto(idProducto: string, anterior: Producto, posterior: Producto): Promise<void> {
  let cambiosAnterior = '', cambiosPosterior = '';
  const globalStore = useGlobalStore();

  if (anterior.nombre !== posterior.nombre) {
    cambiosAnterior += `Nombre: ${anterior.nombre} | `;
    cambiosPosterior += `Nombre: ${posterior.nombre} | `;
  }
  if (anterior.codigo !== posterior.codigo) {
    cambiosAnterior += `Código: ${anterior.codigo} | `;
    cambiosPosterior += `Código: ${posterior.codigo} | `;
  }
  if (anterior.descripcion !== posterior.descripcion) {
    cambiosAnterior += `Descripción: ${anterior.descripcion} | `;
    cambiosPosterior += `Descripción: ${posterior.descripcion} | `;
  }
  if (anterior.pesoUnitario !== posterior.pesoUnitario) {
    cambiosAnterior += `Peso Unitario: ${anterior.pesoUnitario} Kg | `;
    cambiosPosterior += `Peso Unitario: ${posterior.pesoUnitario} Kg | `;
  }
  if (anterior.grupoId !== posterior.grupoId) {
    cambiosAnterior += `Grupo: ${anterior.grupoId ? globalStore.ListasMap[anterior.grupoId] || '' : ''} | `;
    cambiosPosterior += `Grupo: ${posterior.grupoId ? globalStore.ListasMap[posterior.grupoId] || '' : ''} | `;
  }
  if (anterior.fabricanteId !== posterior.fabricanteId) {
    cambiosAnterior += `Fabricante: ${anterior.fabricanteId ? globalStore.ListasMap[anterior.fabricanteId] || '' : ''} | `;
    cambiosPosterior += `Fabricante: ${posterior.fabricanteId ? globalStore.ListasMap[posterior.fabricanteId] || '' : ''} | `;
  }
  if (anterior.nombreArchivo !== posterior.nombreArchivo) {
    cambiosAnterior += `Imagen: ${anterior.nombreArchivo} | `;
    cambiosPosterior += `Imagen: ${posterior.nombreArchivo} | `;
  }
  if (anterior.estadoId !== posterior.estadoId) {
    cambiosAnterior += `Estado: ${anterior.estadoId ? globalStore.ListasMap[anterior.estadoId] || '' : ''} | `;
    cambiosPosterior += `Estado: ${posterior.estadoId ? globalStore.ListasMap[posterior.estadoId] || '' : ''} | `;
  }

  await RegistrarHistorial(idProducto, '[Producto] Modificado', cambiosAnterior, cambiosPosterior);
}
