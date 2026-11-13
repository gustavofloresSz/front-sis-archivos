import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PageEvent } from '@angular/material/paginator';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { forkJoin } from 'rxjs';
import { TramitesService } from '../../../services/gestion-tramites/tramites/tramites.service';
import { DialogTramitesComponent } from './registro-edicion/dialog-tramites/dialog-tramites.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { DetalleReporteTramiteComponent } from './reportes/detalle-reporte-tramite/detalle-reporte-tramite.component';
import { SelloDocumentoComponent } from './detalle/sello-documento/sello-documento.component';
import { HistorialEstadosTramiteComponent } from './detalle/historial-estados-tramite/historial-estados-tramite.component';
import { DetalleFisicoComponent } from '../control-fisico/shared/detalle-fisico/detalle-fisico.component';
import { MovimientoFisicoService } from '../../../services/gestion-tramites/control-fisico/movimiento-fisico.service';
import { ActualizarEstadoTramiteComponent } from './actualizar-estado-tramite/actualizar-estado-tramite.component';
import { AuthService } from '../../../../auth/services/auth.service';
import { obtenerClasesEstadoTramite } from './shared/estado-tramite-presentacion';
import { UbicacionFisicaService } from '../../../services/gestion-tramites/control-fisico/ubicacion-fisica.service';
import { DialogMovimientoFisicoComponent } from '../control-fisico/dialogs/dialog-movimiento-fisico/dialog-movimiento-fisico.component';
import { claseEstadoFisicoActual, textoEstadoFisico } from '../control-fisico/shared/movimiento-fisico-presentacion';

type ModoVistaTramites = 'lista' | 'detalle' | 'actualizarEstado';

@Component({
  selector: 'app-tramites',
  imports: [
    MatTableModule, 
    MatButtonModule, 
    MatIconModule, 
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    DetalleReporteTramiteComponent,
    SelloDocumentoComponent,
    HistorialEstadosTramiteComponent,
    DetalleFisicoComponent,
    ActualizarEstadoTramiteComponent,
  ],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.scss'
})
export class TramitesComponent implements OnInit {
  modoVista: ModoVistaTramites = 'lista';
  tramites: any[] = [];
  tramiteSeleccionado: any | null = null;

  totalRegistros = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [10, 20, 50, 100];

  cargando = false;
  cargandoDetalle = false;
  errorDetalle: string | null = null;
  historialFisico: any[] = [];
  cargandoFisico = false;
  errorFisico: string | null = null;
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  errorOperacion: string | null = null;
  cargandoMovimientoId: number | null = null;

  private dialog = inject(MatDialog);
  private tramitesService = inject(TramitesService);
  private movimientoFisicoService = inject(MovimientoFisicoService);
  private ubicacionFisicaService = inject(UbicacionFisicaService);
  private authService = inject(AuthService);

  private readonly columnasTramites: string[] = [
    'num_folder',
    'codigo_tramite',
    // 'num_tramite',
    
    'nombres_apellidos',
    'descripcion',
    'tipo_tramite',
    'clasificacion_tramite',
    'estado_actual',
    'estado_fisico',
    'distrito',
    'zona',
    'codigo_catastral',
    'resolucion_municipal',
    'fecha_resolucion',
    'observaciones',
  ];

  private readonly columnasTramitesConOpciones: string[] = [
    ...this.columnasTramites,
    'opciones',
  ];

  get displayedColumns(): string[] {
    return this.tieneOpciones
      ? this.columnasTramitesConOpciones
      : this.columnasTramites;
  }

  get tieneOpciones(): boolean {
    return this.puedeEditarTramites || this.puedeRegistrarMovimientos;
  }

  get tramiteEnEstadoFinal(): boolean {
    const estado = this.tramiteSeleccionado?.estado_actual;
    return estado?.es_final === true ||
      ['Concluido', 'Anulado', 'Abandono'].includes(estado?.nombre);
  }

  get puedeCrearTramites(): boolean {
    return this.authService.tienePermiso('tramite', 'crear');
  }

  get puedeEditarTramites(): boolean {
    return this.authService.tienePermiso('tramite', 'editar');
  }

  get puedeCambiarEstado(): boolean {
    return this.authService.tienePermiso('tramite', 'cambiar_estado');
  }

  get puedeRegistrarMovimientos(): boolean {
    return this.authService.tienePermiso(
      'movimiento_fisico',
      'registrar',
    );
  }

  get puedeAgregarArchivos(): boolean {
    return this.authService.tienePermiso('archivo', 'agregar');
  }

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }

  textoEstadoUbicacion(tramite: any): string {
    return tramite.estado_fisico === 'EN_ARCHIVO' ? 'Asignado' : textoEstadoFisico(tramite);
  }

  clasesEstadoUbicacion(tramite: any): string {
    const estado = this.textoEstadoUbicacion(tramite);
    return estado === 'Sin datos'
      ? 'border-gray-200 bg-gray-50 text-gray-700'
      : claseEstadoFisicoActual(estado);
  }

  ngOnInit(): void {
    this.cargarTramites();
  }

  cargarTramites() {
    this.cargando = true;

    const page = this.pageIndex + 1;

    this.tramitesService
      .getAll(page, this.pageSize, this.busqueda)
      .subscribe({
      next: (resp) => {
        this.tramites = resp.data ?? [];
        this.totalRegistros = resp.meta?.total ?? 0;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      },
      });
  }

  buscarTramites(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarTramites();
  }

  buscarAlEscribir(valor: string): void {
    this.busqueda = valor;
    clearTimeout(this.temporizadorBusqueda);
    this.temporizadorBusqueda = setTimeout(
      () => this.buscarTramites(),
      350,
    );
  }

  limpiarBusqueda(): void {
    if (!this.busqueda) {
      return;
    }

    this.busqueda = '';
    this.buscarTramites();
  }

  cambiarPagina(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarTramites();
  }

  agregarTramite() {
    const dialogRef = this.dialog.open(DialogTramitesComponent, {
      width: '1200px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.accion) {
        this.pageIndex = 0;
        this.cargarTramites();
      }
    });
  }

  editarTramite(tramite: any) {
    if (!tramite?.id) {
      return;
    }

    this.cargando = true;

    this.tramitesService.getById(tramite.id).subscribe({
      next: (detalle) => {
        this.cargando = false;

        const dialogRef = this.dialog.open(DialogTramitesComponent, {
          width: '1200px',
          maxWidth: '95vw',
          data: { tramite: detalle },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.accion) {
            this.cargarTramites();
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      },
    });
  }

  registrarMovimiento(tramite: any): void {
    if (!this.puedeRegistrarMovimientos || !tramite?.id) {
      return;
    }

    if (!tramite?.ubicacion_fisica_id) {
      this.errorOperacion =
        'El trámite no tiene una ubicación física asignada. No se puede registrar un movimiento.';
      return;
    }

    this.cargandoMovimientoId = tramite.id;
    this.errorOperacion = null;

    forkJoin({
      estadoFisico: this.movimientoFisicoService.getEstadoFisicoTramite(
        tramite.id,
      ),
      ubicacionesFisicas: this.ubicacionFisicaService.getAll(),
    }).subscribe({
      next: ({ estadoFisico, ubicacionesFisicas }) => {
        this.cargandoMovimientoId = null;

        const dialogRef = this.dialog.open(DialogMovimientoFisicoComponent, {
          width: '650px',
          maxWidth: '95vw',
          disableClose: true,
          data: {
            tramite,
            estadoFisico,
            ubicacionesFisicas: Array.isArray(ubicacionesFisicas)
              ? ubicacionesFisicas
              : [],
          },
        });

        dialogRef.afterClosed().subscribe((registrado) => {
          if (registrado) {
            this.cargarTramites();
          }
        });
      },
      error: (err) => {
        this.cargandoMovimientoId = null;
        this.errorOperacion =
          err?.error?.message ||
          'No se pudo preparar el registro del movimiento físico.';
      },
    });
  }

  verDetalleTramite(tramite: any) {
    if (!tramite?.id) {
      return;
    }

    this.modoVista = 'detalle';
    this.cargandoDetalle = true;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;

    this.tramitesService.getById(tramite.id).subscribe({
      next: (respuesta) => {
        this.tramiteSeleccionado = respuesta?.data ?? respuesta;
        this.cargandoDetalle = false;
        this.cargarHistorialFisico(tramite.id);
      },
      error: (err) => {
        console.error(err);
        this.cargandoDetalle = false;
        this.errorDetalle = 'No se pudo cargar el detalle del trámite.';
      },
    });
  }

  volverAResultados(): void {
    this.modoVista = 'lista';
    this.cargandoDetalle = false;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;
    this.historialFisico = [];
    this.errorFisico = null;
  }

  abrirActualizacionEstado(): void {
    if (this.tramiteSeleccionado?.id && !this.tramiteEnEstadoFinal) {
      this.modoVista = 'actualizarEstado';
    }
  }

  cancelarActualizacionEstado(): void {
    this.modoVista = 'detalle';
  }

  estadoActualizado(tramite: any): void {
    this.tramiteSeleccionado = tramite;
    this.modoVista = 'detalle';
    this.cargarTramites();
  }

  private cargarHistorialFisico(tramiteId: number): void {
    this.cargandoFisico = true;
    this.errorFisico = null;
    this.historialFisico = [];

    this.movimientoFisicoService.getByTramite(tramiteId).subscribe({
      next: (historial) => {
        this.historialFisico = Array.isArray(historial) ? historial : [];
        this.cargandoFisico = false;
      },
      error: () => {
        this.cargandoFisico = false;
        this.errorFisico = 'No se pudo cargar el historial físico del trámite.';
      },
    });
  }
}
