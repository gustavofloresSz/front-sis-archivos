import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, Input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ArchivosService } from '../../../../../services/gestion-tramites/tramites/archivos.service';
import { obtenerClasesEstadoTramite } from '../../shared/estado-tramite-presentacion';
import { esArchivoPdf, iconoArchivo } from '../../../shared/archivos/archivo-adjunto.config';
import { nombreArchivo } from '../../../shared/archivos/archivo-presentacion';
import { describirUbicacionFisica } from '../../../shared/presentacion/ubicacion-fisica-presentacion';
import { VisorArchivoComponent } from '../../../shared/archivos/visor-archivo/visor-archivo.component';

@Component({
  selector: 'app-tramite-detalle',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    VisorArchivoComponent,
  ],
  templateUrl: './tramite-detalle.component.html',
  styleUrl: './tramite-detalle.component.scss'
})
export class TramiteDetalleComponent {
  private archivosService = inject(ArchivosService);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  @Input() tramite: any | null = null;
  @Input() mostrarArchivos = true;
  @Input() mostrarUbicacion = true;
  @Input() consultaReporte = false;

  cargandoPdf = false;
  errorPdf: string | null = null;
  pdfUrl: SafeResourceUrl | null = null;
  archivoEnVista: any | null = null;

  private pdfObjectUrl: string | null = null;
  private pdfSubscription?: Subscription;

  get archivos(): any[] {
    const archivos = this.tramite?.archivos ?? [];
    return Array.isArray(archivos) ? archivos : [];
  }

  get comprobantes(): any[] {
    const comprobantes =
      this.tramite?.comprobantes_pago ??
      this.tramite?.comprobantes ??
      this.tramite?.comprobante_pago ??
      [];

    if (Array.isArray(comprobantes)) {
      return comprobantes;
    }

    return comprobantes ? [comprobantes] : [];
  }

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }

  formatearSuperficie(valor: unknown): string {
    if (valor === null || valor === undefined || valor === '') {
      return '—';
    }

    const numero = Number(valor);
    const superficie = Number.isFinite(numero)
      ? new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(numero)
      : String(valor);

    return `${superficie} m²`;
  }

  verPdf(archivo: any) {
    if (archivo?.id == null) {
      return;
    }

    this.cerrarPdf();

    this.cargandoPdf = true;
    this.errorPdf = null;
    this.archivoEnVista = archivo;

    this.pdfSubscription = this.archivosService.verArchivo(archivo.id, this.consultaReporte ? this.tramite.id : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.pdfObjectUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfObjectUrl);
          this.cargandoPdf = false;
        },
        error: (err) => {
          console.error(err);
          this.cargandoPdf = false;
          this.errorPdf = 'No se pudo cargar el archivo PDF.';
        },
      });
  }

  cerrarPdf() {
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

  nombreArchivo(archivo: any) {
    return nombreArchivo(archivo);
  }

  esPdf(archivo: unknown): boolean {
    return esArchivoPdf(archivo);
  }

  iconoParaArchivo(archivo: unknown): string {
    return iconoArchivo(archivo);
  }

  describirUbicacion(ubicacion: any) {
    return describirUbicacionFisica(ubicacion, {
      incluirInstitucion: false,
      textoSinUbicacion: 'Sin ubicación física',
      textoSinDetalle: 'Ubicación sin detalle',
    });
  }

  ngOnDestroy() {
    this.cerrarPdf();
  }

}
