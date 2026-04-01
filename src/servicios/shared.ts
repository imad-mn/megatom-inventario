import type { UserCredential } from 'firebase/auth';
import type { Cantidades, Inventario, Lista } from './modelos';
import { ref } from 'vue';

export function ObtenerUbicaciones(cantidades: Cantidades[]): string[] {
  const ubicaciones: string[] = [];
  cantidades.forEach(cantidad => {
    const cajon = Inventarios.value.find(x => x.id === cantidad.cajaId);
    if (cajon) {
      const seccion = Inventarios.value.find(x => x.id === cajon.padre);
      if (seccion) {
        const nivel = Inventarios.value.find(x => x.id === seccion.padre);
        if (nivel) {
          const estante = Inventarios.value.find(x => x.id === nivel?.padre);
          if (estante) {
            const galpon = Inventarios.value.find(x => x.id === estante.padre);
            if (galpon) {
              ubicaciones.push(`Galpón ${galpon.nombre} / Estante ${estante.nombre} / Nivel ${nivel.nombre} / Sección ${seccion.nombre} / Caja ${cajon.nombre} / ${cantidad.cantidad} unidades\n`);
            }
          }
        }
      }
    }
  });

  if (ubicaciones.length === 0)
    ubicaciones.push('No hay ubicaciones.');

  return ubicaciones;
}

export const Usuario = ref<UserCredential>();
export const Inventarios = ref<Inventario[]>([]);
export const Listas = ref<Lista[]>([]);

interface DialogoHistorial {
  mostrar: boolean;
  idElemento: string;
  nombreElemento: string;
}
export const dialogoHistorial = ref<DialogoHistorial>({ mostrar: false, idElemento: '', nombreElemento: '' });
