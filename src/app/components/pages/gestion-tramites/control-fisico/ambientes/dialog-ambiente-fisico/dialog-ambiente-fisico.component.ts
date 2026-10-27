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
import { AmbienteFisicoService } from '../../../../../services/gestion-tramites/control-fisico/ambiente-fisico.service';

@Component({
  selector: 'app-dialog-ambiente-fisico',
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
  templateUrl: './dialog-ambiente-fisico.component.html',
})
export class DialogAmbienteFisicoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AmbienteFisicoService);
  private readonly dialogRef = inject(MatDialogRef<DialogAmbienteFisicoComponent>);
  readonly data = inject<{ ambiente?: any }>(MAT_DIALOG_DATA, { optional: true });

  readonly ambiente = this.data?.ambiente;
  readonly esEdicion = !!this.ambiente;
  guardando = false;
  errorMensaje: string | null = null;

  readonly form = this.fb.nonNullable.group({
    nombre: [
      this.ambiente?.nombre ?? '',
      [Validators.required, Validators.maxLength(100)],
    ],
    estado: [this.ambiente?.estado ?? true, Validators.required],
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
      ? this.service.update(this.ambiente.id, payload)
      : this.service.create(payload);

    request.subscribe({
      next: (ambiente) => {
        this.guardando = false;
        this.dialogRef.close({
          accion: this.esEdicion ? 'editado' : 'registrado',
          ambiente,
        });
      },
      error: (error) => {
        this.guardando = false;
        this.errorMensaje = Array.isArray(error?.error?.message)
          ? error.error.message.join('. ')
          : error?.error?.message || 'No se pudo guardar el ambiente físico.';
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
