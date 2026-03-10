import type { Cantidades } from './modelos';
import { Inventarios } from './TablesDbService';

export function ObtenerUbicaciones(cantidades: Cantidades[]): string[] {
    const ubicaciones: string[] = [];
    cantidades.forEach(cantidad => {
      const cajon = Inventarios.value.find(x => x.$id === cantidad.cajon);
      if (cajon) {
        const seccion = Inventarios.value.find(x => x.$id === cajon.padre);
        if (seccion) {
          const nivel = Inventarios.value.find(x => x.$id === seccion.padre);
          if (nivel) {
            const estante = Inventarios.value.find(x => x.$id === nivel?.padre);
            if (estante) {
              const galpon = Inventarios.value.find(x => x.$id === estante.padre);
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
  