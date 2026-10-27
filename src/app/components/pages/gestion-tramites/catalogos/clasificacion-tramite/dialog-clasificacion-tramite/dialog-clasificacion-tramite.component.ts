import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ClasificacionTramiteService } from '../../../../../services/gestion-tramites/catalogos/clasificacion-tramite.service';

@Component({
  selector: 'app-dialog-clasificacion-tramite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dialog-clasificacion-tramite.component.html',
})
export class DialogClasificacionTramiteComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ClasificacionTramiteService);
  private readonly dialogRef = inject(
    MatDialogRef<DialogClasificacionTramiteComponent>,
  );
  readonly data = inject<{ clasificacion?: any }>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly clasificacion = this.data?.clasificacion;
  readonly esEdicion = !!this.clasificacion;
  guardando = false;
  errorMensaje: string | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: [
      this.clasificacion?.nombre ?? '',
      [Validators.required, Validators.maxLength(150)],
    ],
    estado: [this.clasificacion?.estado ?? true, Validators.required],
  });

  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorMensaje = null;
    const payload = this.form.getRawValue();
    const request = this.esEdicion
      ? this.service.update(this.clasificacion.id, payload)
      : this.service.create(payload);

    request.subscribe({
      next: (clasificacion) => {
        this.guardando = false;
        this.dialogRef.close({
          accion: this.esEdicion ? 'editado' : 'registrado',
          clasificacion,
        });
      },
      error: (error) => {
        this.guardando = false;
        this.errorMensaje = Array.isArray(error?.error?.message)
          ? error.error.message.join('. ')
          : error?.error?.message || 'No se pudo guardar la clasificación.';
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
