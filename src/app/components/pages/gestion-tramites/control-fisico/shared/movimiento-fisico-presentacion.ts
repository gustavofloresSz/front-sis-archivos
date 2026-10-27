import {
  fechaEnMilisegundos,
  formatearFechaHora,
} from '../../shared/presentacion/fecha-presentacion';

export function ultimoMovimientoFisico(historial: any[]): any | null {
  if (!Array.isArray(historial) || historial.length === 0) {
    return null;
  }

  return [...historial].sort(
    (a, b) =>
      fechaEnMilisegundos(b?.fecha_movimiento) -
      fechaEnMilisegundos(a?.fecha_movimiento),
  )[0];
}

export function estadoFisicoActual(tramite: any, historial: any[]): string {
  if (!tramite?.ubicacion_fisica_id) {
    return 'Sin asignar';
  }

  const ultimo = ultimoMovimientoFisico(historial);

  if (ultimo?.tipo_movimiento === 'RETIRO') {
    return 'Retirado';
  }

  return 'En archivo';
}

export function claseEstadoFisicoActual(estado: string): string {
  if (estado === 'Retirado') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (estado === 'Sin asignar') {
    return 'border-yellow-200 bg-yellow-50 text-yellow-700';
  }

  return 'border-green-200 bg-green-50 text-green-700';
}

export function describirPersonaMovimiento(movimiento: any): string {
  if (!movimiento) {
    return 'Sin responsable físico actual';
  }

  return [
    movimiento?.nombre_persona,
    movimiento?.documento_persona,
  ].filter(Boolean).join(' - ') || 'Sin persona registrada';
}

export function describirUsuarioMovimiento(usuario: any): string {
  return usuario?.nombre_completo || usuario?.login || 'Sin usuario';
}

export function estadoFisicoTramite(tramite: any): string {
  return tramite?.estado_fisico ?? 'SIN_DATOS';
}

export function textoEstadoFisico(tramite: any): string {
  const etiquetas: Record<string, string> = {
    RETIRADO: 'Retirado',
    EN_ARCHIVO: 'En archivo',
    SIN_ASIGNAR: 'Sin asignar',
  };

  return etiquetas[estadoFisicoTramite(tramite)] ?? 'Sin datos';
}

export function ultimoResponsableFisico(tramite: any): string {
  const ultimoMovimiento = tramite?.ultimo_movimiento;

  if (!ultimoMovimiento || tramite?.estado_fisico !== 'RETIRADO') {
    return '';
  }

  return [
    ultimoMovimiento.nombre_persona,
    ultimoMovimiento.documento_persona,
  ].filter(Boolean).join(' - ');
}

export function textoTipoMovimiento(tipo: string, textoPorDefecto = 'Movimiento'): string {
  const etiquetas: Record<string, string> = {
    RETIRO: 'Retiro',
    DEVOLUCION: 'Devolución',
    TRASLADO: 'Traslado',
  };

  return etiquetas[tipo] ?? (tipo || textoPorDefecto);
}

export function textoUltimoMovimiento(tramite: any): string {
  const movimiento = tramite?.ultimo_movimiento;

  if (!movimiento) {
    return 'Sin movimientos';
  }

  return `${textoTipoMovimiento(movimiento.tipo_movimiento)} - ${formatearFechaHora(
    movimiento.fecha_movimiento,
  )}`;
}
