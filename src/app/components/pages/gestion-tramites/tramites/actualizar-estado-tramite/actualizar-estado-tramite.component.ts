import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {TramitesService,TransicionEstadoTramite,} from '../../../../services/gestion-tramites/tramites/tramites.service';
import { obtenerClasesEstadoTramite } from '../shared/estado-tramite-presentacion';
import {
  CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE,
  esArchivoTramitePermitido,
  FORMATOS_ARCHIVOS_TRAMITE,
  iconoArchivo,
} from '../../shared/archivos/archivo-adjunto.config';

@Component({
  selector: 'app-actualizar-estado-tramite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './actualizar-estado-tramite.component.html',
})
export class ActualizarEstadoTramiteComponent implements OnInit {
  @Input({ required: true }) tramite: any;
  @Output() cancelar = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<any>();

  private readonly fb = inject(FormBuilder);
  private readonly tramitesService = inject(TramitesService);

  readonly form = this.fb.group({
    transicion: [null as TransicionEstadoTramite | null, Validators.required],
    motivo: ['', [Validators.required, Validators.minLength(5)]],
  });

  transiciones: TransicionEstadoTramite[] = [];
  archivos: File[] = [];
  cargando = false;
  guardando = false;
  error: string | null = null;
  readonly formatosArchivosPermitidos = FORMATOS_ARCHIVOS_TRAMITE;
  readonly maximoArchivos = CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE;

  ngOnInit(): void {
    this.cargarTransiciones();
  }

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }

  seleccionarArchivos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const seleccionados = Array.from(input.files ?? []);
    const archivoNoPermitido = seleccionados.find(
      (archivo) => !esArchivoTramitePermitido(archivo),
    );

    if (archivoNoPermitido) {
      this.error =
        'Formato no permitido. Use PDF, imágenes JPG, PNG o WEBP, Word o Excel.';
      input.value = '';
      return;
    }

    const nuevos = seleccionados.filter(
      (archivo) =>
        !this.archivos.some(
          (actual) =>
            actual.name === archivo.name && actual.size === archivo.size,
        ),
    );

    if (
      this.archivos.length + nuevos.length >
      CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE
    ) {
      this.error = `Puede adjuntar como máximo ${CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE} archivos por actualización.`;
      input.value = '';
      return;
    }

    this.archivos = [...this.archivos, ...nuevos];
    this.error = null;
    input.value = '';
  }

  quitarArchivo(index: number): void {
    this.archivos = this.archivos.filter((_, posicion) => posicion !== index);
  }

  iconoParaArchivo(archivo: File): string {
    return iconoArchivo(archivo);
  }

  guardar(): void {
    if (this.form.invalid || this.guardando || !this.tramite?.id) {
      this.form.markAllAsTouched();
      return;
    }

    const transicion = this.form.controls.transicion.value;
    if (!transicion) {
      return;
    }

    this.guardando = true;
    this.error = null;

    this.tramitesService
      .gestionarTramite(
        this.tramite.id,
        transicion,
        this.form.controls.motivo.value ?? '',
        this.archivos,
      )
      .subscribe({
        next: (respuesta) => {
          this.guardando = false;
          this.actualizado.emit(respuesta?.tramite ?? respuesta);
        },
        error: (err) => {
          this.guardando = false;
          this.error = Array.isArray(err?.error?.message)
            ? err.error.message.join('. ')
            : err?.error?.message || 'No se pudo actualizar el estado del trámite.';
        },
      });
  }

  private cargarTransiciones(): void {
    if (!this.tramite?.id) {
      return;
    }

    this.cargando = true;
    this.error = null;

    this.tramitesService.getEstadosPermitidos(this.tramite.id).subscribe({
      next: (respuesta) => {
        this.transiciones = respuesta?.transiciones ?? [];
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.error = err?.error?.message || 'No se pudieron cargar los estados permitidos.';
      },
    });
  }
}
