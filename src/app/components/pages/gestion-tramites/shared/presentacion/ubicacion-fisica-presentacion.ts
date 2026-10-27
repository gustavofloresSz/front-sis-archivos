export interface OpcionesUbicacionFisica {
  incluirInstitucion?: boolean;
  etiquetarFilaColumna?: boolean;
  textoSinUbicacion?: string;
  textoSinDetalle?: string;
}

export function describirUbicacionFisica(
  ubicacion: unknown,
  opciones: OpcionesUbicacionFisica = {},
): string {
  if (!ubicacion) {
    return opciones.textoSinUbicacion ?? 'Sin ubicación';
  }

  const datos = ubicacion as Record<string, any>;
  const estante = datos['estante_fisico'];
  const ambienteFisico = datos['ambiente_fisico'] ?? estante?.ambiente_fisico;
  const institucion = datos['institucion'] ?? ambienteFisico?.institucion;
  const etiquetar = opciones.etiquetarFilaColumna ?? true;

  const partes = [
    opciones.incluirInstitucion === false
      ? ''
      : textoCampo(institucion?.nombre ?? institucion?.sigla),
    textoCampo(ambienteFisico?.nombre ?? datos['ambiente']),
    textoCampo(estante?.codigo ?? estante?.nombre ?? datos['estante']),
    valorPosicion(datos['fila'], 'Fila', etiquetar),
    valorPosicion(datos['columna'], 'Columna', etiquetar),
  ].filter(Boolean);

  return partes.join(' / ') ||
    textoCampo(datos['nombre']) ||
    opciones.textoSinDetalle ||
    'Sin detalle';
}

export function describirInstitucionFisica(ubicacion: unknown): string {
  const datos = ubicacion as Record<string, any> | null;
  return textoCampo(
    datos?.['institucion']?.nombre ??
      datos?.['estante_fisico']?.ambiente_fisico?.institucion?.nombre ??
      datos?.['estante_fisico']?.ambiente_fisico?.institucion?.sigla,
  ) || 'Sin institución';
}

export function describirAmbienteFisico(ubicacion: unknown): string {
  const datos = ubicacion as Record<string, any> | null;
  return textoCampo(
    datos?.['ambiente_fisico']?.nombre ??
      datos?.['estante_fisico']?.ambiente_fisico?.nombre ??
      datos?.['ambiente'],
  ) || 'Sin ambiente';
}

export function describirEstanteFisico(ubicacion: unknown): string {
  const datos = ubicacion as Record<string, any> | null;
  return textoCampo(
    datos?.['estante_fisico']?.codigo ??
      datos?.['estante_fisico']?.nombre ??
      datos?.['estante'],
  ) || 'Sin estante';
}

export function describirFilaColumnaFisica(ubicacion: unknown): string {
  if (!ubicacion) {
    return 'Sin fila ni columna';
  }

  const datos = ubicacion as Record<string, unknown>;
  const fila = datos['fila'] ? `Fila ${datos['fila']}` : 'Sin fila';
  const columna = datos['columna'] ? `Columna ${datos['columna']}` : 'Sin columna';

  return `${fila} / ${columna}`;
}

function valorPosicion(valor: unknown, etiqueta: string, etiquetar: boolean): string {
  const texto = textoCampo(valor);
  return texto && etiquetar ? `${etiqueta} ${texto}` : texto;
}

function textoCampo(valor: unknown): string {
  if (valor && typeof valor === 'object') {
    const objeto = valor as Record<string, unknown>;
    return String(objeto['nombre'] ?? objeto['codigo'] ?? objeto['id'] ?? '').trim();
  }

  return String(valor ?? '').trim();
}
