import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input, signal, TemplateRef, ViewChild, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize, Subscription } from 'rxjs';
import { ArchivosService } from '../../../../../services/gestion-tramites/tramites/archivos.service';
import { SelloDocumentoService, TIPOS_SELLO, TipoSello } from '../../../../../services/gestion-tramites/tramites/sello-documento.service';
import { AuthService } from '../../../../../../auth/services/auth.service';
import { TramitesService } from '../../../../../services/gestion-tramites/tramites/tramites.service';
import {
  CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE,
  acumularArchivosSeleccionados,
  esArchivoPdf,
  esArchivoTramitePermitido,
  FORMATOS_ARCHIVOS_TRAMITE,
  iconoArchivo,
} from '../../../shared/archivos/archivo-adjunto.config';
import {
  descargarBlob,
  extensionArchivoVisible,
  nombreArchivo,
} from '../../../shared/archivos/archivo-presentacion';
import { VisorArchivoComponent } from '../../../shared/archivos/visor-archivo/visor-archivo.component';
import { SeleccionarSellosDialogComponent } from './seleccionar-sellos-dialog.component';

interface AvisoExitoArchivos {
  mensaje: string;
  duracion: number;
  abierto: WritableSignal<boolean>;
}

@Component({
  selector: 'app-sello-documento',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    VisorArchivoComponent,
  ],
  templateUrl: './sello-documento.component.html',
  styleUrl: './sello-documento.component.scss',
})
export class SelloDocumentoComponent {
  @ViewChild('avisoExito', { static: true })
  private avisoExito!: TemplateRef<{ $implicit: AvisoExitoArchivos }>;
  @ViewChild('confirmarRetiro', { static: true })
  private confirmarRetiro!: TemplateRef<{ $implicit: string }>;
  @Input({ required: true }) tramite: any;
  @Input() permitirGestionArchivos = false;
  @Input() consultaReporte = false;

  private readonly selloDocumentoService = inject(SelloDocumentoService);
  private readonly archivosService = inject(ArchivosService);
  private readonly tramitesService = inject(TramitesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  aplicandoArchivoId: number | null = null;
  retirandoArchivoId: number | null = null;
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
  readonly maximoArchivos = CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE;

  private pdfObjectUrl: string | null = null;
  private pdfSubscription?: Subscription;

  get puedeAplicarSello(): boolean {
    return !this.consultaReporte && this.authService.tienePermiso('archivo', 'aplicar_sello');
  }

  get puedeVerArchivos(): boolean {
    return this.authService.tienePermiso('archivo', 'ver');
  }

  get puedeDescargarArchivos(): boolean {
    return this.puedeVerArchivos &&
      this.authService.tienePermiso('archivo', 'descargar');
  }

  get puedeGestionarArchivos(): boolean {
    return !this.consultaReporte && this.permitirGestionArchivos;
  }

  get puedeRetirarArchivos(): boolean {
    return !this.consultaReporte &&
      !this.authService.tienePermiso('institucion', 'acceso_global') &&
      this.authService.tienePermiso('archivo', 'eliminar');
  }

  get gestionEnCurso(): boolean {
    return this.cargandoArchivos || this.aplicandoArchivoId !== null || this.retirandoArchivoId !== null;
  }

  confirmarRetiroArchivo(archivo: { id: number }): void {
    if (!this.puedeRetirarArchivos || !archivo?.id || this.gestionEnCurso) return;

    const tramite = this.tramite;
    this.dialog.open<unknown, string, boolean>(this.confirmarRetiro, {
      data: this.nombreArchivo(archivo),
      width: '420px',
      maxWidth: '95vw',
      autoFocus: 'first-tabbable',
    }).afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmado => {
      if (!confirmado || this.tramite !== tramite || this.gestionEnCurso) return;

      this.retirandoArchivoId = archivo.id;
      this.mensaje = null;
      this.mensajeError = false;
      this.archivosService.retirarDeTramite(archivo.id).pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.retirandoArchivoId = null; }),
      ).subscribe({
        next: () => {
          tramite.archivos = tramite.archivos.filter((item: { id: number }) => item.id !== archivo.id);
          if (this.archivoEnVista?.id === archivo.id) this.cerrarPdf();
          this.notificarExito('Archivo eliminado correctamente.');
        },
        error: (err) => {
          this.mensajeError = true;
          this.mensaje = Array.isArray(err?.error?.message)
            ? err.error.message.join('. ')
            : err?.error?.message || 'No se pudo eliminar el archivo.';
        },
      });
    });
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
    if (!this.puedeAplicarSello || !archivo?.id || archivo.es_sellado || !this.esPdf(archivo) || this.gestionEnCurso) {
      return;
    }

    this.dialog.open<SeleccionarSellosDialogComponent, string, TipoSello[]>(
      SeleccionarSellosDialogComponent,
      { data: this.nombreArchivo(archivo), width: '420px', maxWidth: '95vw' },
    ).afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tipos => {
        if (tipos?.length && !this.gestionEnCurso) this.generarCopiaLegalizada(archivo.id, tipos);
      });
  }

  etiquetasSellosAnteriores(archivo: any): string {
    if (!this.nombreArchivo(archivo).endsWith(' - copia legalizada.pdf')) return '';

    return TIPOS_SELLO.filter(tipo => archivo.tipos_sello?.includes(tipo.valor))
      .map(tipo => tipo.etiqueta).join(' y ');
  }

  private generarCopiaLegalizada(archivoId: number, tipos: TipoSello[]): void {
    this.aplicandoArchivoId = archivoId;
    this.mensaje = null;
    this.mensajeError = false;

    this.selloDocumentoService.aplicar(archivoId, tipos)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (respuesta) => {
        this.aplicandoArchivoId = null;
        this.notificarExito(respuesta?.message || 'Copia legalizada generada correctamente.');

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
    if (!archivos.length) return;

    if (archivos.some((archivo) => !esArchivoTramitePermitido(archivo))) {
      this.mensajeError = true;
      this.mensaje =
        'Formato no permitido. Use PDF, imágenes JPG, PNG o WEBP, Word o Excel.';
      return;
    }

    const acumulados = acumularArchivosSeleccionados(this.archivosSeleccionados, archivos);
    if (acumulados.length > CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE) {
      this.mensajeError = true;
      this.mensaje = `Puede agregar como máximo ${CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE} archivos por operación.`;
      return;
    }

    this.archivosSeleccionados = acumulados;
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
      this.gestionEnCurso
    ) {
      return;
    }

    this.cargandoArchivos = true;
    const cantidadArchivos = this.archivosSeleccionados.length;
    this.mensaje = null;
    this.mensajeError = false;

    this.tramitesService
      .agregarArchivos(this.tramite.id, this.archivosSeleccionados)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.cargandoArchivos = false;
          this.archivosSeleccionados = [];
          this.notificarExito(cantidadArchivos === 1
            ? 'Archivo agregado correctamente.'
            : 'Archivos agregados correctamente.');

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

  private notificarExito(mensaje: string): void {
    const aviso: AvisoExitoArchivos = { mensaje, duracion: 5000, abierto: signal(false) };
    const referencia = this.snackBar.openFromTemplate(this.avisoExito, {
      data: aviso,
      announcementMessage: mensaje,
      duration: aviso.duracion,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: 'aviso-exito-archivos',
    });
    referencia.afterOpened().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => aviso.abierto.set(true));
  }

  tipoArchivo(archivo: unknown): string {
    const extension = extensionArchivoVisible(archivo);
    if (extension === 'DOC' || extension === 'DOCX') return 'Word';
    if (extension === 'XLS' || extension === 'XLSX') return 'Excel';
    if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(extension)) return 'Imagen';
    return extension === 'ARCHIVO' ? 'Archivo' : extension;
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
      .verArchivo(archivo.id, this.consultaReporte ? this.tramite.id : undefined)
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
      .descargarArchivo(archivo.id, this.consultaReporte ? this.tramite.id : undefined)
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
