import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute } from '@angular/router';
import { MovimientoFisicoService } from '../../../../../services/gestion-tramites/control-fisico/movimiento-fisico.service';
import { TramitesService } from '../../../../../services/gestion-tramites/tramites/tramites.service';
import { DetalleFisicoComponent } from '../../shared/detalle-fisico/detalle-fisico.component';
import { Location } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
// import { FlujoGraficoFisicoComponent } from '../../shared/flujo-grafico-fisico/flujo-grafico-fisico.component';
import { formatearFechaHora } from '../../../shared/presentacion/fecha-presentacion';
import { describirUbicacionFisica } from '../../../shared/presentacion/ubicacion-fisica-presentacion';
import {
  estadoFisicoTramite,
  textoEstadoFisico,
  textoTipoMovimiento,
  textoUltimoMovimiento,
  ultimoResponsableFisico,
} from '../../shared/movimiento-fisico-presentacion';

type ModoVistaReporteFisico = 'busqueda' | 'detalle';

@Component({
  selector: 'app-reporte-movimientos-fisicos',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    DetalleFisicoComponent,
    // FlujoGraficoFisicoComponent, // Conservado para reactivar la pestaña gráfica.
  ],
  templateUrl: './reporte-movimientos-fisicos.component.html',
  styleUrl: './reporte-movimientos-fisicos.component.scss',
})
export class ReporteMovimientosFisicosComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  private readonly tramitesService = inject(TramitesService);
  private readonly movimientoFisicoService = inject(MovimientoFisicoService);

  searchControl = new FormControl('');

  modoVista: ModoVistaReporteFisico = 'busqueda';

  tramites: any[] = [];
  tramiteSeleccionado: any | null = null;
  historial: any[] = [];

  cargandoTabla = false;
  cargandoDetalle = false;

  errorTabla: string | null = null;
  errorDetalle: string | null = null;

  busquedaRealizada = false;
  detalleCargadoDesdeUrl = false;
  soloInformacionFisica = false;

  displayedColumns = [
    'codigo_tramite',
    'solicitante',
    'ubicacion',
    'estado_fisico',
    'ultimo_movimiento',
    'acciones',
  ];

  page = 1;
  limit = 10;
  total = 0;
  pageSizeOptions = [10, 20, 50, 100];

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tramiteId = Number(params.get('id'));
        this.soloInformacionFisica = params.get('modo') === 'detalle';

        if (tramiteId && tramiteId > 0) {
          this.detalleCargadoDesdeUrl = true;
          this.cargarReportePorId(tramiteId);
        }
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.modoVista === 'detalle') {
          return;
        }

        this.page = 1;
        this.tramiteSeleccionado = null;
        this.historial = [];
        this.modoVista = 'busqueda';
        this.buscarTramites();
      });
  }

  buscarTramites(): void {
    const texto = this.obtenerTextoBusqueda();

    this.errorTabla = null;

    if (!texto) {
      this.tramites = [];
      this.total = 0;
      this.busquedaRealizada = false;
      this.cargandoTabla = false;
      return;
    }

    this.cargandoTabla = true;
    this.busquedaRealizada = true;

    this.movimientoFisicoService
      .buscarTramitesControlFisico(texto, this.page, this.limit)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.tramites = response?.data ?? [];
          this.total = response?.total ?? this.tramites.length;
          this.page = response?.page ?? this.page;
          this.limit = response?.limit ?? this.limit;
          this.cargandoTabla = false;
        },
        error: (err) => {
          console.error(err);
          this.cargandoTabla = false;
          this.tramites = [];
          this.total = 0;
          this.errorTabla =
            err?.error?.message ||
            'No se pudieron buscar los trámites para el reporte físico.';
        },
      });
  }

  buscarManual(): void {
    this.page = 1;
    this.tramiteSeleccionado = null;
    this.historial = [];
    this.modoVista = 'busqueda';
    this.buscarTramites();
  }

  limpiarBusqueda(): void {
    this.searchControl.setValue('');
    this.tramites = [];
    this.total = 0;
    this.busquedaRealizada = false;
    this.tramiteSeleccionado = null;
    this.historial = [];
    this.modoVista = 'busqueda';
    this.errorTabla = null;
    this.errorDetalle = null;
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.buscarTramites();
  }

  verReporte(tramite: any): void {
    if (!tramite?.id) {
      this.errorTabla = 'No se encontró el trámite seleccionado.';
      return;
    }

    this.soloInformacionFisica = false;
    this.detalleCargadoDesdeUrl = false;
    this.cargarReportePorId(tramite.id);
  }

  cargarReportePorId(tramiteId: number): void {
    this.cargandoDetalle = true;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;
    this.historial = [];
    this.modoVista = 'detalle';

    this.tramitesService.getById(tramiteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuestaTramite: any) => {
          this.tramiteSeleccionado = respuestaTramite?.data ?? respuestaTramite;

          this.movimientoFisicoService.getByTramite(tramiteId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (respuestaHistorial: any) => {
                this.historial = Array.isArray(respuestaHistorial)
                  ? respuestaHistorial
                  : respuestaHistorial?.data ?? [];

                this.cargandoDetalle = false;
              },
              error: (err) => {
                console.error(err);
                this.cargandoDetalle = false;
                this.errorDetalle =
                  err?.error?.message ||
                  'No se pudo cargar el historial físico del trámite.';
              },
            });
        },
        error: (err) => {
          console.error(err);
          this.cargandoDetalle = false;
          this.errorDetalle =
            err?.error?.message ||
            'No se pudo cargar la información del trámite.';
        },
      });
  }

  volverAResultados(): void {
    if (this.detalleCargadoDesdeUrl) {
      this.location.back();
      return;
    }

    this.tramiteSeleccionado = null;
    this.historial = [];
    this.errorDetalle = null;
    this.cargandoDetalle = false;
    this.modoVista = 'busqueda';
  }

  estadoFisicoTramite(tramite: any): string {
    return estadoFisicoTramite(tramite);
  }

  textoEstadoFisico(tramite: any): string {
    return textoEstadoFisico(tramite);
  }

  ultimoResponsableFisico(tramite: any): string {
    return ultimoResponsableFisico(tramite);
  }

  textoUltimoMovimiento(tramite: any): string {
    return textoUltimoMovimiento(tramite);
  }

  textoTipoMovimiento(tipo: string): string {
    return textoTipoMovimiento(tipo);
  }

  describirUbicacion(ubicacion: any): string {
    return describirUbicacionFisica(ubicacion);
  }

  ubicacionTramite(tramite: any): string {
    return this.describirUbicacion(tramite?.ubicacion_fisica);
  }

  formatearFecha(fecha: string | Date | null): string {
    return formatearFechaHora(fecha);
  }

  private obtenerTextoBusqueda(): string {
    return this.searchControl.value?.trim() ?? '';
  }
}
