import { extensionArchivo } from './archivo-adjunto.config';

export function nombreArchivo(archivo: unknown, nombrePorDefecto = 'Documento'): string {
  if (archivo instanceof File) {
    return archivo.name;
  }

  const datos = archivo as Record<string, unknown> | null;
  const nombre = datos?.['nombre_original'] ??
    datos?.['nombre_archivo'] ??
    datos?.['nombre'] ??
    datos?.['filename'] ??
    datos?.['name'];

  if (String(nombre ?? '').trim()) {
    return String(nombre).trim();
  }

  return datos?.['id'] != null ? `Archivo ${datos['id']}` : nombrePorDefecto;
}

export function nombreArchivoSinExtension(archivo: unknown): string {
  const nombre = nombreArchivo(archivo);
  const posicionExtension = nombre.lastIndexOf('.');

  return posicionExtension > 0 ? nombre.slice(0, posicionExtension) : nombre;
}

export function extensionArchivoVisible(archivo: unknown): string {
  const extension = extensionArchivo(nombreArchivo(archivo));
  return extension ? extension.slice(1).toUpperCase() : 'ARCHIVO';
}

export function descargarBlob(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');

  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
