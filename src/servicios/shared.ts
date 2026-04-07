import type { UserCredential } from 'firebase/auth';
import type { Cantidades, Estante, Galpon, Lista } from './modelos';
import { ref } from 'vue';
import { Coleccion, ObtenerTodos } from './TablesDbService';

export async function ObtenerUbicaciones(cantidades: Cantidades[]): Promise<string[]> {
  const galpones = await ObtenerTodos<Galpon>(Coleccion.Galpones);
  const ubicaciones: string[] = [];

  for (const cantidad of cantidades) {
    for (const galpon of galpones) {
      for (const estante of galpon.estantes) {
        for (const nivel of estante.niveles) {
          for (const seccion of nivel.secciones) {
            const caja = seccion.cajas.find(c => c.id === cantidad.cajaId);
            if (caja) {
              ubicaciones.push(`Galpón ${galpon.nombre} / Estante ${estante.nombre} / Nivel ${nivel.nombre} / Sección ${seccion.nombre} / Caja ${caja.nombre} / ${cantidad.cantidad} unidades\n`);
            }
          }
        }
      }
    }
  }

  if (ubicaciones.length === 0)
    ubicaciones.push('No hay ubicaciones.');

  return ubicaciones;
}

export const Usuario = ref<UserCredential>();
export const Listas = ref<Lista[]>([]);
export const GalponSeleccionado = ref<Galpon | null>(null);
export const EstanteSeleccionado = ref<Estante | null>(null);

interface DialogoHistorial {
  mostrar: boolean;
  idElemento: string;
  nombreElemento: string;
}
export const dialogoHistorial = ref<DialogoHistorial>({ mostrar: false, idElemento: '', nombreElemento: '' });
