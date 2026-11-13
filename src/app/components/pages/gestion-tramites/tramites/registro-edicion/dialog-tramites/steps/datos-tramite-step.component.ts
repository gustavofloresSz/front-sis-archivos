import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-datos-tramite-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es' },
  ],
  template: `
    <div [formGroup]="form()" class="datos-tramite-grid">
      @if (esEdicion()) {
        <div class="identificadores-edicion">
        <mat-form-field appearance="outline">
          <mat-label>Código del trámite</mat-label>
          <input matInput formControlName="codigo_tramite" readonly>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Número de folder</mat-label>
          <input matInput formControlName="num_folder" readonly>
        </mat-form-field>
        </div>
      }

      <mat-form-field appearance="outline">
        <mat-label>N° Trámite</mat-label>
        <input matInput type="number" min="1" step="1" formControlName="num_tramite" required>
        <mat-error>Ingrese un número de trámite mayor a cero</mat-error>
      </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Gestión</mat-label>
          <mat-select formControlName="gestion" required>
            @for (gestion of gestiones(); track gestion) {
              <mat-option [value]="gestion">{{ gestion }}</mat-option>
            }
          </mat-select>
          <mat-error>La gestión es requerida</mat-error>
        </mat-form-field>


      <mat-form-field appearance="outline">
        <mat-label>Zona</mat-label>
        <input matInput formControlName="zona">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Distrito</mat-label>
        <input matInput formControlName="distrito" maxlength="100">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Código catastral</mat-label>
        <input matInput formControlName="codigo_catastral">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Matrícula</mat-label>
        <input matInput formControlName="matricula">
      </mat-form-field>

      <mat-form-field appearance="outline" class="solicitante">
        <mat-label>Nombres y apellidos</mat-label>
        <input matInput formControlName="nombres_apellidos" required>
        <mat-error>El solicitante es requerido</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Resolución complementaria/aclaratoria</mat-label>
        <input matInput formControlName="resolucion_complementaria_aclaratoria">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Resolución municipal</mat-label>
        <input matInput formControlName="resolucion_municipal">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Fecha de resolución</mat-label>
        <input
          matInput
          [matDatepicker]="pickerFechaResolucion"
          formControlName="fecha_resolucion"
          readonly
        >
        <mat-datepicker-toggle matIconSuffix [for]="pickerFechaResolucion"></mat-datepicker-toggle>
        <mat-datepicker #pickerFechaResolucion></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Fecha resolución complementaria/aclaratoria</mat-label>
        <input
          matInput
          [matDatepicker]="pickerFechaResolucionComplementaria"
          formControlName="fecha_resolucion_complementaria_aclaratoria"
          readonly
        >
        <mat-datepicker-toggle
          matIconSuffix
          [for]="pickerFechaResolucionComplementaria">
        </mat-datepicker-toggle>
        <mat-datepicker #pickerFechaResolucionComplementaria></mat-datepicker>
      </mat-form-field>

      <mat-form-field appearance="outline" class="descripcion">
        <mat-label>Descripción</mat-label>
        <textarea matInput rows="2" formControlName="descripcion"></textarea>
      </mat-form-field>
    </div>
  `,
  styles: `
    :host { display: block; }
    .datos-tramite-grid { display: grid; grid-template-columns: 1fr; gap: 8px 14px; padding-top: 8px; }
    mat-form-field { min-width: 0; width: 100%; }
    .identificadores-edicion { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .descripcion { grid-column: 1 / -1; }
    @media (min-width: 700px) {
      .datos-tramite-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .solicitante { grid-column: span 2; }
    }
  `,
})
export class DatosTramiteStepComponent {
  constructor(private adapter: DateAdapter<any>) {
    this.adapter.setLocale('es');
  }

  form = input.required<FormGroup>();
  esEdicion = input(false);
  gestiones = input<number[]>([]);

}
