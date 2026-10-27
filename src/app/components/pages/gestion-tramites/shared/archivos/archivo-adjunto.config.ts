export const CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE = 30;

export const FORMATOS_ARCHIVOS_TRAMITE =
  '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx';

const EXTENSIONES_PERMITIDAS = new Set(
  FORMATOS_ARCHIVOS_TRAMITE.split(','),
);

export function extensionArchivo(nombre: unknown): string {
  const nombreNormalizado = String(nombre ?? '').trim().toLowerCase();
  const posicionPunto = nombreNormalizado.lastIndexOf('.');

  return posicionPunto >= 0 ? nombreNormalizado.slice(posicionPunto) : '';
}

export function esArchivoTramitePermitido(archivo: File): boolean {
  return EXTENSIONES_PERMITIDAS.has(extensionArchivo(archivo.name));
}

export function esArchivoPdf(archivo: unknown): boolean {
  return extensionArchivo(obtenerNombreArchivo(archivo)) === '.pdf';
}

export function iconoArchivo(archivo: unknown): string {
  const extension = extensionArchivo(obtenerNombreArchivo(archivo));

  if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    return 'image';
  }

  if (['.doc', '.docx'].includes(extension)) {
    return 'description';
  }

  if (['.xls', '.xlsx'].includes(extension)) {
    return 'table_view';
  }

  return extension === '.pdf' ? 'picture_as_pdf' : 'draft';
}

function obtenerNombreArchivo(archivo: unknown): unknown {
  if (typeof archivo === 'string') {
    return archivo;
  }

  if (archivo instanceof File) {
    return archivo.name;
  }

  const datos = archivo as Record<string, unknown> | null;
  return datos?.['nombre_original'] ??
    datos?.['nombre_archivo'] ??
    datos?.['nombre'] ??
    datos?.['filename'] ??
    datos?.['name'];
}
