import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MovimientoFisicoService } from '../../../../services/gestion-tramites/control-fisico/movimiento-fisico.service';
import { TramitesService } from '../../../../services/gestion-tramites/tramites/tramites.service';
import { UbicacionFisicaService } from '../../../../services/gestion-tramites/control-fisico/ubicacion-fisica.service';
import { DialogMovimientoFisicoComponent } from '../dialogs/dialog-movimiento-fisico/dialog-movimiento-fisico.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { DetalleFisicoComponent } from '../shared/detalle-fisico/detalle-fisico.component';
import { AuthService } from '../../../../../auth/services/auth.service';
import { describirUbicacionFisica } from '../../shared/presentacion/ubicacion-fisica-presentacion';
import {
  estadoFisicoTramite,
  textoEstadoFisico,
  ultimoResponsableFisico,
} from '../shared/movimiento-fisico-presentacion';

type ModoVistaMovimientoFisico = 'busqueda' | 'detalle';

@Component({
  selector: 'app-movimientos-fisicos',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DetalleFisicoComponent,
  ],
  templateUrl: './movimientos-fisicos.component.html',
  styleUrl: './movimientos-fisicos.component.scss'
})
export class MovimientosFisicosComponent {
  private readonly ubicacionFisicaService = inject(UbicacionFisicaService);
  private readonly movimientoFisicoService = inject(MovimientoFisicoService);
  private readonly tramitesService = inject(TramitesService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  get puedeRegistrar(): boolean {
    return this.authService.tienePermiso('movimiento_fisico', 'registrar');
  }

  modoVista: ModoVistaMovimientoFisico = 'busqueda';
  busqueda = '';
  cargando = false;
  cargandoEstado = false;
  cargandoDetalle = false;
  errorMensaje: string | null = null;
  errorDetalle: string | null = null;

  tramiteSeleccionado: any | null = null;
  historialSeleccionado: any[] = [];

  private timeoutBusqueda: any;

  tramitesFiltrados: any[] = [];
  ubicacionesFisicas: any[] = [];

  totalTramites = 0;
  page = 1;
  limit = 10;
  pageSizeOptions = [5, 10, 20, 50, 100];

  columnasTramites = [
    'codigo_tramite',
    'nombres_apellidos',
    'ubicacion',
    'estado_fisico',
    'acciones',
  ];

  ngOnInit() {
    this.cargarUbicaciones();
  }

  buscarTramites(resetPage = true) {
    this.errorMensaje = null;

    const texto = this.busqueda.trim();

    if (!texto) {
      this.tramitesFiltrados = [];
      this.totalTramites = 0;
      this.page = 1;
      return;
    }

    if (resetPage) {
      this.page = 1;
    }

    this.cargando = true;

    this.movimientoFisicoService
      .buscarTramitesControlFisico(texto, this.page, this.limit)
      .subscribe({
        next: (response: any) => {
          this.tramitesFiltrados = response?.data ?? [];
          this.totalTramites = response?.total ?? 0;
          this.page = response?.page ?? this.page;
          this.limit = response?.limit ?? this.limit;
          this.cargando = false;
        },
        error: (err) => {
          this.cargando = false;
          this.tramitesFiltrados = [];
          this.totalTramites = 0;
          this.errorMensaje =
            err?.error?.message || 'No se pudieron buscar los trámites.';
        },
      });
  }

  cambiarPagina(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.buscarTramites(false);
  }

  cargarUbicaciones() {
    this.ubicacionFisicaService.getAll().subscribe({
      next: (response: any) => {
        this.ubicacionesFisicas = Array.isArray(response)
          ? response
          : response?.data ?? [];
      },
      error: (err) => console.error(err),
    });
  }

  buscarTramitesAutomatico() {
    clearTimeout(this.timeoutBusqueda);

    this.timeoutBusqueda = setTimeout(() => {
      this.buscarTramites(true);
    }, 400);
  }

  filtrarTramites() {
    this.buscarTramites(true);
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

  verDetalleFisico(tramite: any): void {
    if (!tramite?.id) {
      this.errorMensaje = 'No se encontró el trámite seleccionado.';
      return;
    }

    this.modoVista = 'detalle';
    this.cargandoDetalle = true;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;
    this.historialSeleccionado = [];

    forkJoin({
      tramite: this.tramitesService.getById(tramite.id),
      historial: this.movimientoFisicoService.getByTramite(tramite.id),
    }).subscribe({
      next: ({ tramite: respuestaTramite, historial: respuestaHistorial }) => {
        this.tramiteSeleccionado =
          respuestaTramite?.data ?? respuestaTramite;
        this.historialSeleccionado = respuestaHistorial;
        this.cargandoDetalle = false;
      },
      error: (err) => {
        this.cargandoDetalle = false;
        this.errorDetalle =
          err?.error?.message ||
          'No se pudo cargar la información física del trámite.';
      },
    });
  }

  volverAResultados(): void {
    this.modoVista = 'busqueda';
    this.cargandoDetalle = false;
    this.errorDetalle = null;
    this.tramiteSeleccionado = null;
    this.historialSeleccionado = [];
  }

  abrirDialogMovimiento(tramite: any) {
    if (!tramite?.id) {
      this.errorMensaje = 'No se encontró el trámite seleccionado.';
      return;
    }

    if (!tramite?.ubicacion_fisica_id) {
      this.errorMensaje =
        'El trámite no tiene una ubicación física asignada. No se puede registrar un movimiento físico.';
      return;
    }

    this.cargandoEstado = true;
    this.errorMensaje = null;

    this.movimientoFisicoService.getEstadoFisicoTramite(tramite.id).subscribe({
      next: (estadoFisico: any) => {
        this.cargandoEstado = false;

        const dialogRef = this.dialog.open(DialogMovimientoFisicoComponent, {
          width: '650px',
          disableClose: true,
          data: {
            tramite,
            estadoFisico,
            ubicacionesFisicas: this.ubicacionesFisicas,
          },
        });

        dialogRef.afterClosed().subscribe((registrado) => {
          if (registrado) {
            this.buscarTramites(false);
          }
        });
      },
      error: (err) => {
        this.cargandoEstado = false;
        this.errorMensaje =
          err?.error?.message ||
          'No se pudo obtener el estado físico del trámite.';
      },
    });
  }

  describirUbicacion(ubicacion: any): string {
    return describirUbicacionFisica(ubicacion);
  }

  ubicacionTramite(tramite: any): string {
    return this.describirUbicacion(tramite?.ubicacion_fisica);
  }
}
