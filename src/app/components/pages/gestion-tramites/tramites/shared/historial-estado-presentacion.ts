import { fechaEnMilisegundos } from '../../shared/presentacion/fecha-presentacion';

export function ordenarHistorialEstados<T extends { fecha_cambio?: unknown }>(
  historial: T[],
): T[] {
  return [...historial].sort(
    (a, b) => fechaEnMilisegundos(a.fecha_cambio) - fechaEnMilisegundos(b.fecha_cambio),
  );
}

export function nombreResponsableEstado(
  cambio: any,
  textoPorDefecto = 'Sin responsable',
): string {
  return String(
    cambio?.usuario?.nombre_completo ??
      cambio?.usuario?.login ??
      '',
  ).trim() || textoPorDefecto;
}
