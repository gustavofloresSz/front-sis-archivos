export type EstadoTramiteVisual =
  | 'archivado'
  | 'observaciones'
  | 'suspendido'
  | 'concluido'
  | 'anulado'
  | 'abandono'
  | 'desconocido';

const CLASES_ESTADO: Record<EstadoTramiteVisual, string> = {
  archivado: 'border-sky-200 bg-sky-100 text-sky-800',
  observaciones: 'border-yellow-200 bg-yellow-100 text-yellow-800',
  suspendido: 'border-orange-200 bg-orange-100 text-orange-800',
  concluido: 'border-green-200 bg-green-100 text-green-800',
  anulado: 'border-red-200 bg-red-100 text-red-800',
  abandono: 'border-red-300 bg-red-100 text-red-900',
  desconocido: 'border-slate-200 bg-slate-100 text-slate-700',
};

export function obtenerEstadoTramiteVisual(
  nombre: unknown,
): EstadoTramiteVisual {
  const estado = String(nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  switch (estado) {
    case 'archivado':
      return 'archivado';
    case 'con observaciones':
      return 'observaciones';
    case 'suspendido':
      return 'suspendido';
    case 'concluido':
      return 'concluido';
    case 'anulado':
      return 'anulado';
    case 'abandono':
      return 'abandono';
    default:
      return 'desconocido';
  }
}

export function obtenerClasesEstadoTramite(nombre: unknown): string {
  return `border ${CLASES_ESTADO[obtenerEstadoTramiteVisual(nombre)]}`;
}
