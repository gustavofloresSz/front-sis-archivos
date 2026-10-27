import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  ReportesService,
  ResumenWorkflowTramites,
} from '../../../../../services/gestion-tramites/tramites/reportes.service';
import { TipoTramiteService } from '../../../../../services/gestion-tramites/catalogos/tipo-tramite.service';

interface TipoTramiteFiltro {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-resumen-workflow-tramites',
  imports: [
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './resumen-workflow-tramites.component.html',
  styleUrl: './resumen-workflow-tramites.component.scss',
})
export class ResumenWorkflowTramitesComponent implements OnInit {
  resumen: ResumenWorkflowTramites | null = null;
  cargando = true;
  error = '';
  zoom = 1;
  arrastrando = false;
  desplazamientoX = 0;
  desplazamientoY = 0;
  tiposTramite: TipoTramiteFiltro[] = [];

  private readonly fb = inject(FormBuilder);
  readonly filtrosForm = this.fb.group({
    fechaDesde: [null as Date | null],
    fechaHasta: [null as Date | null],
    tipoTramiteId: [null as number | null],
  });

  private inicioArrastreX = 0;
  private inicioArrastreY = 0;
  private desplazamientoInicialX = 0;
  private desplazamientoInicialY = 0;

  private readonly reportesService = inject(ReportesService);
  private readonly tipoTramiteService = inject(TipoTramiteService);
  private readonly location = inject(Location);

  ngOnInit(): void {
    this.cargarTiposTramite();
    this.cargarResumen();
  }

  cargarResumen(): void {
    this.cargando = true;
    this.error = '';

    const filtros = this.filtrosForm.getRawValue();

    this.reportesService.obtenerResumenWorkflow({
      fechaDesde: this.formatearFecha(filtros.fechaDesde),
      fechaHasta: this.formatearFecha(filtros.fechaHasta),
      tipoTramiteId: filtros.tipoTramiteId ?? undefined,
    }).subscribe({
      next: (resumen) => {
        this.resumen = resumen;
        this.zoom = 1;
        this.desplazamientoX = 0;
        this.desplazamientoY = 0;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message
          ?? 'No se pudo cargar el resumen del flujo de trámites.';
        this.cargando = false;
      },
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      fechaDesde: null,
      fechaHasta: null,
      tipoTramiteId: null,
    });
    this.cargarResumen();
  }

  volver(): void {
    this.location.back();
  }

  cambiarZoomConRueda(event: WheelEvent): void {
    event.preventDefault();
    this.zoom = event.deltaY < 0
      ? Math.min(1.5, Number((this.zoom + 0.1).toFixed(1)))
      : Math.max(0.7, Number((this.zoom - 0.1).toFixed(1)));
  }

  iniciarArrastre(event: PointerEvent): void {
    if (![0, 1, 2].includes(event.button)) {
      return;
    }

    event.preventDefault();
    const viewport = event.currentTarget as HTMLDivElement;

    this.arrastrando = true;
    this.inicioArrastreX = event.clientX;
    this.inicioArrastreY = event.clientY;
    this.desplazamientoInicialX = this.desplazamientoX;
    this.desplazamientoInicialY = this.desplazamientoY;
    viewport.setPointerCapture(event.pointerId);
  }

  moverArrastre(event: PointerEvent): void {
    if (!this.arrastrando) {
      return;
    }

    this.desplazamientoX = this.desplazamientoInicialX
      + event.clientX - this.inicioArrastreX;
    this.desplazamientoY = this.desplazamientoInicialY
      + event.clientY - this.inicioArrastreY;
  }

  finalizarArrastre(event: PointerEvent): void {
    const viewport = event.currentTarget as HTMLDivElement;
    this.arrastrando = false;

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
  }

  cantidadEstado(nombre: string): number {
    return this.buscarEstado(nombre)?.cantidad ?? 0;
  }

  porcentajeEstado(nombre: string): number {
    return this.buscarEstado(nombre)?.porcentaje ?? 0;
  }

  get alcanceDescripcion(): string {
    if (!this.resumen) {
      return '';
    }

    if (this.resumen.alcance.tipo === 'global') {
      return 'Todas las instituciones autorizadas';
    }

    return this.resumen.alcance.institucion_nombre
      ?? 'Institución del usuario actual';
  }

  private cargarTiposTramite(): void {
    this.tipoTramiteService.getAll().subscribe({
      next: (tipos) => {
        this.tiposTramite = tipos;
      },
    });
  }

  private formatearFecha(fecha: Date | null): string | undefined {
    if (!fecha) {
      return undefined;
    }

    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private buscarEstado(nombre: string) {
    const normalizado = this.normalizar(nombre);
    return this.resumen?.estados.find(
      (estado) => this.normalizar(estado.nombre) === normalizado,
    );
  }

  private normalizar(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}
