import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-clasificacion-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  template: `
    <div [formGroup]="form()" class="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2 lg:grid-cols-4">
      <mat-form-field appearance="outline">
        <mat-label>Segmento</mat-label>
        <mat-select
          [value]="segmentoActual()"
          required
          [disabled]="esEdicion()"
          (selectionChange)="cambiarSegmento($event.value)"
        >
          <mat-option [value]="null">Seleccione un segmento</mat-option>

          @for (segmento of segmentosDisponibles(); track segmento) {
            <mat-option [value]="segmento">{{ segmento }}</mat-option>
          }

          @if (!segmentosDisponibles().length) {
            <mat-option disabled>No existen segmentos registrados</mat-option>
          }
        </mat-select>

        <mat-hint>Filtra los tipos de trámite disponibles.</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Tipo de trámite</mat-label>
        <mat-select
          formControlName="tipo_tramite_id"
          required
          [disabled]="!segmentoActual()"
        >
          @for (tipo of tiposTramiteFiltrados(); track tipo.id) {
            <mat-option [value]="tipo.id">{{ tipo.nombre }}</mat-option>
          }

          @if (segmentoActual() && !tiposTramiteFiltrados().length) {
            <mat-option disabled>No existen tipos de trámite para este segmento</mat-option>
          }
        </mat-select>

        <mat-hint>Seleccione primero el segmento.</mat-hint>
        <mat-error>El tipo de trámite es requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Clasificación</mat-label>
        <mat-select formControlName="clasificacion_tramite_id" required>
          @for (clasificacion of clasificacionesTramite(); track clasificacion.id) {
            <mat-option [value]="clasificacion.id">
              {{ clasificacion.nombre }}
            </mat-option>
          }
        </mat-select>

        <mat-error>La clasificación es requerida</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="campo-estado">
        <mat-label>{{ esEdicion() ? 'Estado actual' : 'Estado posterior al registro' }}</mat-label>

        <mat-select formControlName="estado_actual_id" [required]="esEdicion()">
          <!-- @if (!esEdicion()) {
            <mat-option [value]="null">Sin cambio posterior</mat-option>
          } -->

          @for (estado of estadosTramite(); track estado.id) {
            <mat-option [value]="estado.id">{{ estado.nombre }}</mat-option>
          }

          @if (!estadosTramite().length) {
            <mat-option disabled>No existen estados disponibles</mat-option>
          }
        </mat-select>

        @if (esEdicion()) {
          <mat-hint>El estado se modifica desde la acción específica.</mat-hint>
        }

        @if (esEdicion()) {
          <mat-error>El estado actual es requerido</mat-error>
        }
      </mat-form-field>
      @if (esUrbanizacion()) {
        <div class="col-span-full grid grid-cols-1 gap-4 md:grid-cols-3">
          <mat-form-field appearance="outline">
            <mat-label>Manzano</mat-label>
            <input matInput formControlName="manzano" maxlength="100">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Lote</mat-label>
            <input matInput formControlName="lote" maxlength="100">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Superficie (m²)</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="superficie">
            <mat-error>Ingrese una superficie mayor o igual a cero</mat-error>
          </mat-form-field>
        </div>
      }
    </div>
  `,
  styles: `
    :host ::ng-deep .campo-estado .mat-mdc-form-field-hint-wrapper {
      padding-inline: 0;
    }
  `,
})
export class ClasificacionStepComponent {
  form = input.required<FormGroup>();
  tiposTramite = input<any[]>([]);
  clasificacionesTramite = input<any[]>([]);
  estadosTramite = input<any[]>([]);
  esEdicion = input(false);
  esUrbanizacion = input(false);

  segmentoSeleccionado = signal<string | null>(null);

  segmentosDisponibles = computed(() => {
    return Array.from(
      new Set(
        this.tiposTramite()
          .map((tipo) => this.textoCampo(tipo.segmento))
          .filter((segmento) => segmento !== ''),
      ),
    ).sort((a, b) => a.localeCompare(b));
  });

  segmentoActual = computed(() => {
    const segmentoSeleccionado = this.segmentoSeleccionado();

    if (segmentoSeleccionado) {
      return segmentoSeleccionado;
    }

    return this.obtenerSegmentoDesdeTipoSeleccionado();
  });

  tiposTramiteFiltrados = computed(() => {
    const segmento = this.segmentoActual();

    if (!segmento) {
      return [];
    }

    return this.tiposTramite().filter(
      (tipo) => this.normalizar(tipo.segmento) === this.normalizar(segmento),
    );
  });

  cambiarSegmento(segmento: string | null) {
    if (this.esEdicion()) {
      return;
    }

    this.segmentoSeleccionado.set(segmento);

    const tipoTramiteControl = this.form().get('tipo_tramite_id');

    tipoTramiteControl?.setValue(null);
    tipoTramiteControl?.markAsTouched();
    tipoTramiteControl?.updateValueAndValidity();
  }

  private obtenerSegmentoDesdeTipoSeleccionado(): string | null {
    const tipoTramiteId = this.form().get('tipo_tramite_id')?.value;

    if (!tipoTramiteId) {
      return null;
    }

    const tipoSeleccionado = this.tiposTramite().find(
      (tipo) => String(tipo.id) === String(tipoTramiteId),
    );

    if (!tipoSeleccionado?.segmento) {
      return null;
    }

    return this.textoCampo(tipoSeleccionado.segmento);
  }

  private textoCampo(valor: unknown): string {
    if (valor && typeof valor === 'object') {
      const objeto = valor as Record<string, unknown>;

      return String(objeto['nombre'] ?? objeto['codigo'] ?? objeto['id'] ?? '');
    }

    return String(valor ?? '').trim();
  }

  private normalizar(valor: unknown): string {
    return this.textoCampo(valor).trim().toLocaleLowerCase();
  }
}
