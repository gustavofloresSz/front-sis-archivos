import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { CriterioReporte, FiltrosInstitucionReporte, InstitucionReporte, ReportesService } from '../../../../../services/gestion-tramites/tramites/reportes.service';
import { DetalleReporteTramiteComponent } from '../detalle-reporte-tramite/detalle-reporte-tramite.component';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { SelloDocumentoComponent } from '../../detalle/sello-documento/sello-documento.component';
import { obtenerClasesEstadoTramite } from '../../shared/estado-tramite-presentacion';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { FILTROS_REPORTE, FiltrosReporteComponent } from './filtros-reporte.component';
import { HistorialEstadosTramiteComponent } from '../../detalle/historial-estados-tramite/historial-estados-tramite.component';
import { DetalleFisicoComponent } from '../../../control-fisico/shared/detalle-fisico/detalle-fisico.component';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

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
    SelloDocumentoComponent,
    DetalleFisicoComponent,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatBottomSheetModule,
    HistorialEstadosTramiteComponent,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'es-BO' }],
  templateUrl: './reporte-tramites.component.html',
  styleUrl: './reporte-tramites.component.scss'
})
export class ReporteTramitesComponent {
  private reportesService = inject(ReportesService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private bottomSheet = inject(MatBottomSheet);
  private busquedaSubscription?: Subscription;
  private detalleSubscription?: Subscription;
  private location = inject(Location);

  detalleCargadoDesdeUrl = false;
  searchControl = new FormControl('');
  criterio: CriterioReporte = 'todos';
  institucionControl = new FormControl<number | null>(null);
  fechas = new FormGroup({
    desde: new FormControl<Date | null>(null),
    hasta: new FormControl<Date | null>(null),
  });
  instituciones: InstitucionReporte[] = [];
  cargandoInstituciones = false;
  errorInstituciones: string | null = null;

  get filtroActual() {
    return FILTROS_REPORTE.find((filtro) => filtro.criterio === this.criterio)!;
  }

  abrirFiltros(): void {
    this.bottomSheet.open(FiltrosReporteComponent, {
      data: this.criterio,
      ariaLabel: 'Elegir filtro del reporte',
    }).afterDismissed().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((criterio: CriterioReporte | undefined) => {
        if (!criterio || criterio === this.criterio) return;
        this.criterio = criterio;
        this.institucionControl.setValue(null, { emitEvent: false });
        this.fechas.reset({ desde: null, hasta: null }, { emitEvent: false });
        this.limpiarBusqueda();
        if (criterio === 'institucion') this.cargarInstituciones();
      });
  }

  modoVista: ModoVistaReporte = 'busqueda';

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
    'institucion',
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
        if (tramiteId && tramiteId > 0) {
          this.detalleCargadoDesdeUrl = true;
          this.cargarReportePorId(tramiteId);
        }
      });

    this.institucionControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.buscarManual());
    this.fechas.valueChanges.pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.modoVista === 'busqueda') this.buscarManual();
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
    this.detalleSubscription?.unsubscribe();
    this.cargandoDetalle = true;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;
    this.modoVista = 'detalle';

    this.detalleSubscription = this.reportesService.obtenerTramite(tramiteId)
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
    this.busquedaSubscription?.unsubscribe();
    const search = this.obtenerTextoBusqueda();
    const filtros = this.obtenerFiltrosInstitucion();

    this.errorTabla = null;

    if (this.criterio === 'institucion' && this.fechas.invalid) {
      this.errorTabla = 'Revise las fechas: ingrese un rango válido.';
      this.cargandoTabla = false;
      this.tramites = [];
      this.total = 0;
      return;
    }

    if (!search && !filtros.institucion_id && !filtros.fecha_desde && !filtros.fecha_hasta) {
      this.tramites = [];
      this.total = 0;
      this.busquedaRealizada = false;
      this.cargandoTabla = false;
      return;
    }

    this.cargandoTabla = true;
    this.busquedaRealizada = true;

    this.busquedaSubscription = this.reportesService.buscarTramites(this.page, this.limit, search, this.criterio, filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          const data = respuesta.data;

          this.tramites = Array.isArray(data) ? data : [];
          this.total = respuesta?.meta?.total ?? this.tramites.length;

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

    this.cargarReportePorId(tramite.id);
  }

  volverAResultados(): void {
    this.detalleSubscription?.unsubscribe();
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
    this.busquedaSubscription?.unsubscribe();
    this.searchControl.setValue('', { emitEvent: false });
    this.cargandoTabla = false;
    this.errorTabla = null;
    this.page = 1;
    this.tramites = [];
    this.total = 0;
    this.busquedaRealizada = false;
    this.tramiteSeleccionado = null;
    this.modoVista = 'busqueda';
    this.buscarTramites();
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

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }

  cargarInstituciones(): void {
    if (this.instituciones.length || this.cargandoInstituciones) return;
    this.cargandoInstituciones = true;
    this.errorInstituciones = null;
    this.reportesService.obtenerInstituciones().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (instituciones) => {
        this.instituciones = instituciones;
        this.cargandoInstituciones = false;
      },
      error: () => {
        this.errorInstituciones = 'No se pudieron cargar las instituciones.';
        this.cargandoInstituciones = false;
      },
    });
  }

  limpiarFechas(): void {
    this.fechas.reset({ desde: null, hasta: null }, { emitEvent: false });
    this.buscarManual();
  }

  private obtenerFiltrosInstitucion(): FiltrosInstitucionReporte {
    if (this.criterio !== 'institucion') return {};
    const fecha = (valor: Date | null): string | undefined => {
      if (!valor || !Number.isFinite(valor.getTime())) return undefined;
      return `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, '0')}-${String(valor.getDate()).padStart(2, '0')}`;
    };
    return {
      institucion_id: this.institucionControl.value ?? undefined,
      fecha_desde: fecha(this.fechas.controls.desde.value),
      fecha_hasta: fecha(this.fechas.controls.hasta.value),
    };
  }

  private obtenerTextoBusqueda(): string {
    return this.searchControl.value?.trim() ?? '';
  }

}
