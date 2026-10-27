const OPCIONES_FECHA_HORA: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatearFechaHora(
  fecha: string | Date | null | undefined,
  textoSinFecha = 'Sin fecha',
): string {
  if (!fecha) {
    return textoSinFecha;
  }

  return new Date(fecha).toLocaleString('es-BO', OPCIONES_FECHA_HORA);
}

export function formatearFechaIso(fecha: unknown): string | null {
  if (!fecha) {
    return null;
  }

  if (typeof fecha === 'string') {
    return fecha.split('T')[0];
  }

  if (fecha instanceof Date) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  return null;
}

export function fechaEnMilisegundos(fecha: unknown): number {
  const milisegundos = new Date(fecha as string | number | Date).getTime();
  return Number.isNaN(milisegundos) ? 0 : milisegundos;
}
