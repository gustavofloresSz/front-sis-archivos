import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ArchivosService } from '../../../../../services/gestion-tramites/tramites/archivos.service';
import { SelloDocumentoService } from '../../../../../services/gestion-tramites/tramites/sello-documento.service';
import { AuthService } from '../../../../../../auth/services/auth.service';
import { TramitesService } from '../../../../../services/gestion-tramites/tramites/tramites.service';
import {
  CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE,
  esArchivoPdf,
  esArchivoTramitePermitido,
  FORMATOS_ARCHIVOS_TRAMITE,
  iconoArchivo,
} from '../../../shared/archivos/archivo-adjunto.config';
import {
  descargarBlob,
  extensionArchivoVisible,
  nombreArchivo,
  nombreArchivoSinExtension,
} from '../../../shared/archivos/archivo-presentacion';
import { VisorArchivoComponent } from '../../../shared/archivos/visor-archivo/visor-archivo.component';

@Component({
  selector: 'app-sello-documento',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    VisorArchivoComponent,
  ],
  templateUrl: './sello-documento.component.html',
  styleUrl: './sello-documento.component.scss',
})
export class SelloDocumentoComponent {
  @Input({ required: true }) tramite: any;
  @Input() permitirGestionArchivos = false;

  private readonly selloDocumentoService = inject(SelloDocumentoService);
  private readonly archivosService = inject(ArchivosService);
  private readonly tramitesService = inject(TramitesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);

  aplicandoArchivoId: number | null = null;
  mensaje: string | null = null;
  mensajeError = false;
  cargandoPdf = false;
  descargandoArchivoId: number | null = null;
  errorPdf: string | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  archivoEnVista: any | null = null;
  archivosSeleccionados: File[] = [];
  cargandoArchivos = false;
  readonly formatosArchivosPermitidos = FORMATOS_ARCHIVOS_TRAMITE;

  private pdfObjectUrl: string | null = null;
  private pdfSubscription?: Subscription;

  get puedeAplicarSello(): boolean {
    return this.authService.tienePermiso('archivo', 'aplicar_sello');
  }

  get puedeVerArchivos(): boolean {
    return this.authService.tienePermiso('archivo', 'ver');
  }

  get puedeDescargarArchivos(): boolean {
    return this.puedeVerArchivos &&
      this.authService.tienePermiso('archivo', 'descargar');
  }

  get puedeGestionarArchivos(): boolean {
    return this.permitirGestionArchivos;
  }

  get archivosActivos(): any[] {
    const archivos = Array.isArray(this.tramite?.archivos)
      ? this.tramite.archivos
      : [];

    return archivos
      .filter(
        (archivo: any) =>
          !archivo?.estado || archivo.estado === 'ACTIVO',
      )
      .sort((a: any, b: any) => Number(a?.id ?? 0) - Number(b?.id ?? 0));
  }

  aplicarSello(archivo: any): void {
    if (!archivo?.id || archivo?.es_sellado || this.aplicandoArchivoId) {
      return;
    }

    this.aplicandoArchivoId = archivo.id;
    this.mensaje = null;
    this.mensajeError = false;

    this.selloDocumentoService.aplicar(archivo.id).subscribe({
      next: (respuesta) => {
        this.aplicandoArchivoId = null;
        this.mensaje = respuesta?.message || 'Sello aplicado correctamente.';

        if (respuesta?.archivo) {
          const archivosActuales = Array.isArray(this.tramite?.archivos)
            ? this.tramite.archivos
            : [];
          this.tramite.archivos = [...archivosActuales, respuesta.archivo];
        }
      },
      error: (err) => {
        this.aplicandoArchivoId = null;
        this.mensajeError = true;
        this.mensaje = Array.isArray(err?.error?.message)
          ? err.error.message.join('. ')
          : err?.error?.message || 'No se pudo aplicar el sello al PDF.';
      },
    });
  }

  seleccionarArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivos = input.files ? Array.from(input.files) : [];
    input.value = '';

    if (archivos.some((archivo) => !esArchivoTramitePermitido(archivo))) {
      this.archivosSeleccionados = [];
      this.mensajeError = true;
      this.mensaje =
        'Formato no permitido. Use PDF, imágenes JPG, PNG o WEBP, Word o Excel.';
      return;
    }

    if (archivos.length > CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE) {
      this.archivosSeleccionados = [];
      this.mensajeError = true;
      this.mensaje = `Puede agregar como máximo ${CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE} archivos por operación.`;
      return;
    }

    this.archivosSeleccionados = archivos;
    this.mensaje = null;
    this.mensajeError = false;
  }

  quitarArchivoSeleccionado(indice: number): void {
    this.archivosSeleccionados = this.archivosSeleccionados.filter(
      (_, posicion) => posicion !== indice,
    );
  }

  agregarArchivos(): void {
    if (
      !this.tramite?.id ||
      !this.archivosSeleccionados.length ||
      this.cargandoArchivos
    ) {
      return;
    }

    this.cargandoArchivos = true;
    this.mensaje = null;
    this.mensajeError = false;

    this.tramitesService
      .agregarArchivos(this.tramite.id, this.archivosSeleccionados)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.cargandoArchivos = false;
          this.archivosSeleccionados = [];
          this.mensaje =
            respuesta?.message || 'Archivos agregados correctamente.';

          if (respuesta?.tramite?.archivos) {
            this.tramite.archivos = respuesta.tramite.archivos;
          }
        },
        error: (err) => {
          this.cargandoArchivos = false;
          this.mensajeError = true;
          this.mensaje = Array.isArray(err?.error?.message)
            ? err.error.message.join('. ')
            : err?.error?.message || 'No se pudieron agregar los archivos.';
        },
      });
  }

  nombreArchivo(archivo: any): string {
    return nombreArchivo(archivo);
  }

  nombreArchivoSinExtension(archivo: unknown): string {
    return nombreArchivoSinExtension(archivo);
  }

  extensionArchivo(archivo: unknown): string {
    return extensionArchivoVisible(archivo);
  }

  verPdf(archivo: any): void {
    if (!archivo?.id || !this.puedeVerArchivos) {
      return;
    }

    this.cerrarPdf();
    this.cargandoPdf = true;
    this.errorPdf = null;
    this.archivoEnVista = archivo;

    this.pdfSubscription = this.archivosService
      .verArchivo(archivo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.pdfObjectUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `${this.pdfObjectUrl}#toolbar=0&navpanes=0`,
          );
          this.cargandoPdf = false;
        },
        error: () => {
          this.cargandoPdf = false;
          this.errorPdf = 'No se pudo cargar el archivo PDF.';
        },
      });
  }

  descargarArchivo(archivo: any): void {
    if (
      !archivo?.id ||
      !this.puedeDescargarArchivos ||
      this.descargandoArchivoId !== null
    ) {
      return;
    }

    this.descargandoArchivoId = archivo.id;
    this.mensaje = null;
    this.mensajeError = false;

    this.archivosService
      .descargarArchivo(archivo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          descargarBlob(blob, this.nombreArchivo(archivo));
          this.descargandoArchivoId = null;
        },
        error: (err) => {
          this.descargandoArchivoId = null;
          this.mensajeError = true;
          this.mensaje = Array.isArray(err?.error?.message)
            ? err.error.message.join('. ')
            : err?.error?.message || 'No se pudo descargar el archivo.';
        },
      });
  }

  cerrarPdf(): void {
    this.pdfSubscription?.unsubscribe();
    this.pdfSubscription = undefined;

    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }

    this.pdfObjectUrl = null;
    this.pdfUrl = null;
    this.archivoEnVista = null;
    this.cargandoPdf = false;
    this.errorPdf = null;
  }

  ngOnDestroy(): void {
    this.cerrarPdf();
  }

  esPdf(archivo: unknown): boolean {
    return esArchivoPdf(archivo);
  }

  iconoParaArchivo(archivo: unknown): string {
    return iconoArchivo(archivo);
  }
}
