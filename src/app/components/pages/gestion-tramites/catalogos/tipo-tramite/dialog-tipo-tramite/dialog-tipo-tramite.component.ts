import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TipoTramiteService } from '../../../../../services/gestion-tramites/catalogos/tipo-tramite.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-dialog-tipo-tramite',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ esEdicion ? 'Editar Tipo de Trámite' : 'Registrar Tipo de Trámite' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="tipoTramiteForm">

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre</mat-label>

          <input matInput formControlName="nombre">

          @if (tipoTramiteForm.get('nombre')?.invalid && tipoTramiteForm.get('nombre')?.touched) {
            <mat-error>
              El nombre es obligatorio
            </mat-error>
          }

        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Segmento</mat-label>
          <input matInput formControlName="segmento">

          @if (tipoTramiteForm.get('segmento')?.invalid && tipoTramiteForm.get('segmento')?.touched) {
            <mat-error>El segmento es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            <mat-option [value]="true">Activo</mat-option>
            <mat-option [value]="false">Inactivo</mat-option>
          </mat-select>
        </mat-form-field>

        @if (errorMensaje) {
          <p class="text-red-600 text-sm">
            {{ errorMensaje }}
          </p>
        }

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancelar()" class="app-button-secondary">
        Cancelar
      </button>

      <button mat-flat-button color="primary" type="button" [disabled]="guardando" (click)="guardar()" class="app-button-primary">
        {{ esEdicion ? 'Actualizar' : 'Registrar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogTipoTramiteComponent {
  private fb = inject(FormBuilder);
  private tipoTramiteService = inject(TipoTramiteService);
  private dialogRef = inject(MatDialogRef<DialogTipoTramiteComponent>);

  data = inject(MAT_DIALOG_DATA, { optional: true });

  guardando = false;
  errorMensaje: string | null = null;

  tipoTramiteEditando = this.data?.tipoTramite;
  esEdicion = !!this.tipoTramiteEditando;

  tipoTramiteForm = this.fb.nonNullable.group({
    nombre: [
      this.tipoTramiteEditando?.nombre || '',
      Validators.required,
    ],
    segmento: [
      {
        value: this.tipoTramiteEditando?.segmento || '',
        disabled: this.esEdicion,
      },
      Validators.required,
    ],
    descripcion: [this.tipoTramiteEditando?.descripcion || ''],
    estado: [this.tipoTramiteEditando?.estado ?? true],
  });

  guardar() {
    if (this.tipoTramiteForm.invalid || this.guardando) {
      this.tipoTramiteForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorMensaje = null;

    const valores = this.tipoTramiteForm.getRawValue();
    const payload = this.esEdicion
      ? {
          nombre: valores.nombre,
          descripcion: valores.descripcion || undefined,
          estado: valores.estado,
        }
      : valores;

    const request = this.esEdicion
      ? this.tipoTramiteService.update(
          this.tipoTramiteEditando.id,
          payload,
        )
      : this.tipoTramiteService.create(
          payload,
        );

    request.subscribe({
      next: (tipoTramite) => {
        this.guardando = false;

        this.dialogRef.close({
          accion: this.esEdicion ? 'editado' : 'registrado',
          tipoTramite,
        });
      },

      error: (err) => {
        this.guardando = false;
        this.errorMensaje = err?.error?.message || 'No se pudo guardar el registro';
      },
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
