import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportesService } from '../../../../../services/gestion-tramites/tramites/reportes.service';

@Component({
  selector: 'app-reporte-tramite',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reporte-tramite.component.html',
  styleUrl: './reporte-tramite.component.scss',
})
export class ReporteTramiteComponent implements OnChanges, OnDestroy {
  private readonly reportesService = inject(ReportesService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) tramiteId!: number;
  @Input() codigoTramite = '';
  @ViewChild('visorPdf') visorPdf?: ElementRef<HTMLIFrameElement>;

  cargando = false;
  visorCargado = false;
  error: string | null = null;
  reporteUrl: SafeResourceUrl | null = null;
  private reporteObjectUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tramiteId'] && this.tramiteId > 0) {
      this.cargarReporte();
    }
  }

  ngOnDestroy(): void {
    this.liberarReporte();
  }

  cargarReporte(): void {
    if (!this.tramiteId || this.cargando) {
      return;
    }

    this.cargando = true;
    this.visorCargado = false;
    this.error = null;
    this.liberarReporte();

    this.reportesService
      .obtenerReporteTramite(this.tramiteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pdf) => {
          this.reporteObjectUrl = URL.createObjectURL(pdf);
          this.reporteUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(
              this.reporteObjectUrl,
            );
          this.cargando = false;
        },
        error: (error) => {
          console.error(error);
          this.error = 'No se pudo generar el reporte del trámite.';
          this.cargando = false;
        },
      });
  }

  descargarReporte(): void {
    if (!this.reporteObjectUrl) {
      return;
    }

    const enlace = document.createElement('a');
    enlace.href = this.reporteObjectUrl;
    enlace.download = `reporte-tramite-${this.nombreArchivoSeguro()}.pdf`;
    enlace.click();
  }

  imprimirReporte(): void {
    if (!this.visorCargado) {
      return;
    }

    this.visorPdf?.nativeElement.contentWindow?.print();
  }

  private liberarReporte(): void {
    if (this.reporteObjectUrl) {
      URL.revokeObjectURL(this.reporteObjectUrl);
    }

    this.reporteObjectUrl = null;
    this.reporteUrl = null;
  }

  private nombreArchivoSeguro(): string {
    return (
      this.codigoTramite
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || String(this.tramiteId)
    );
  }
}
