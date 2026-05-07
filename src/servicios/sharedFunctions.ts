export function FormatoFechaHora(fecha: Date): string {
  const formatter = new Intl.DateTimeFormat('es-VE', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return `${fecha.toLocaleDateString()} (${formatter.format(fecha)})`;
}
