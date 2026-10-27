import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { TramitesService } from '../../../../../services/gestion-tramites/tramites/tramites.service';
import { DetalleReporteTramiteComponent } from '../detalle-reporte-tramite/detalle-reporte-tramite.component';
import { WorkflowReporteTramiteComponent } from '../workflow-reporte-tramite/workflow-reporte-tramite.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { SelloDocumentoComponent } from '../../detalle/sello-documento/sello-documento.component';
import { obtenerClasesEstadoTramite } from '../../shared/estado-tramite-presentacion';
import { ReporteTramiteComponent } from '../reporte-tramite/reporte-tramite.component';

type ModoVistaReporte = 'busqueda' | 'detalle';

@Component({
  selector: 'app-reporte-tramites',
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
    MatTabsModule,
    MatTableModule,
    DetalleReporteTramiteComponent,
    WorkflowReporteTramiteComponent,
    SelloDocumentoComponent,
    ReporteTramiteComponent,
  ],
  templateUrl: './reporte-tramites.component.html',
  styleUrl: './reporte-tramites.component.scss'
})
export class ReporteTramitesComponent {
  private tramitesService = inject(TramitesService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  detalleCargadoDesdeUrl = false;
  searchControl = new FormControl('');

  modoVista: ModoVistaReporte = 'busqueda';
  modoDetalleSimple = false;

  tramites: any[] = [];
  tramiteSeleccionado: any | null = null;

  cargandoTabla = false;
  cargandoDetalle = false;

  errorTabla: string | null = null;
  errorDetalle: string | null = null;

  busquedaRealizada = false;

  displayedColumns = [
    'codigo_tramite',
    'solicitante',
    'tipo_tramite',
    'gestion',
    'estado',
    'observaciones',
  ];

  page = 1;
  limit = 10;
  total = 0;

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tramiteId = Number(params.get('id'));
        const modo = params.get('modo');

        this.modoDetalleSimple = modo === 'detalle';

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
        this.modoVista = 'busqueda';
        this.buscarTramites();
      });
  }

  cargarReportePorId(tramiteId: number): void {
    this.cargandoDetalle = true;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;
    this.modoVista = 'detalle';

    this.tramitesService.getById(tramiteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.tramiteSeleccionado = respuesta?.data ?? respuesta;
          this.cargandoDetalle = false;
        },
        error: (err) => {
          console.error(err);
          this.cargandoDetalle = false;
          this.errorDetalle = 'No se pudo cargar el reporte del trámite.';
        },
      });
  }

  buscarTramites(): void {
    const search = this.obtenerTextoBusqueda();

    this.errorTabla = null;

    if (!search) {
      this.tramites = [];
      this.total = 0;
      this.busquedaRealizada = false;
      this.cargandoTabla = false;
      return;
    }

    this.cargandoTabla = true;
    this.busquedaRealizada = true;

    this.tramitesService.getAll(this.page, this.limit, search)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          const data =
            respuesta?.data ??
            respuesta?.items ??
            respuesta?.tramites ??
            respuesta;

          this.tramites = Array.isArray(data) ? data : [];
          this.total = respuesta?.total ?? this.tramites.length;

          this.cargandoTabla = false;
        },
        error: (err) => {
          console.error(err);
          this.cargandoTabla = false;
          this.errorTabla = 'No se pudo cargar la lista de trámites.';
        },
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.buscarTramites();
  }

  verReporte(tramite: any): void {
    if (!tramite?.id) {
      return;
    }

    this.cargandoDetalle = true;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;

    this.tramitesService.getById(tramite.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.tramiteSeleccionado = respuesta?.data ?? respuesta;
          this.cargandoDetalle = false;
          this.modoVista = 'detalle';
        },
        error: (err) => {
          console.error(err);
          this.cargandoDetalle = false;
          this.errorDetalle = 'No se pudo cargar el reporte del trámite.';
        },
      });
  }

  volverAResultados(): void {
    if (this.detalleCargadoDesdeUrl) {
      this.location.back();
      return;
    }

    this.tramiteSeleccionado = null;
    this.errorDetalle = null;
    this.cargandoDetalle = false;
    this.modoVista = 'busqueda';
  }

  limpiarBusqueda(): void {
    this.searchControl.setValue('');
    this.tramites = [];
    this.total = 0;
    this.busquedaRealizada = false;
    this.tramiteSeleccionado = null;
    this.modoVista = 'busqueda';
  }

  buscarManual(): void {
    this.page = 1;
    this.tramiteSeleccionado = null;
    this.modoVista = 'busqueda';
    this.buscarTramites();
  }

  nombreTipoTramite(tramite: any): string {
    return tramite?.tipo_tramite?.nombre ?? tramite?.tipo_tramite_nombre ?? '—';
  }

  nombreEstado(tramite: any): string {
    return tramite?.estado_actual?.nombre ?? tramite?.estado_actual_nombre ?? '—';
  }

  verResumenFlujo(): void {
    void this.router.navigate(['/main/reporte-tramites/resumen-flujo']);
  }

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }

  private obtenerTextoBusqueda(): string {
    return this.searchControl.value?.trim() ?? '';
  }

}
