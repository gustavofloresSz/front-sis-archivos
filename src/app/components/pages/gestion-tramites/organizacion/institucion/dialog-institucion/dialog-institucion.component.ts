import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { InstitucionService } from '../../../../../services/gestion-tramites/organizacion/institucion.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

type InstitucionDialogData = {
  institucion?: any;
};
@Component({
  selector: 'app-dialog-institucion',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './dialog-institucion.component.html',
  styleUrl: './dialog-institucion.component.scss'
})
export class DialogInstitucionComponent {

  private fb = inject(FormBuilder);
  private institucionService = inject(InstitucionService);
  private dialogRef = inject(MatDialogRef<DialogInstitucionComponent>);
  data = inject<InstitucionDialogData>(MAT_DIALOG_DATA, { optional: true });

  guardando = false;
  errorMensaje: string | null = null;
  institucionEditando = this.data?.institucion;
  esEdicion = !!this.institucionEditando;

  institucionForm = this.fb.nonNullable.group({
    nombre: [this.institucionEditando?.nombre || '', Validators.required],
    sigla: [this.institucionEditando?.sigla || '', Validators.required],
  });

  guardarInstitucion() {
    if (this.institucionForm.invalid || this.guardando) {
      this.institucionForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorMensaje = null;

    const request = this.esEdicion
      ? this.institucionService.update(this.institucionEditando.id, this.institucionForm.getRawValue())
      : this.institucionService.create(this.institucionForm.getRawValue());

    request.subscribe({
      next: (institucion) => {
        this.guardando = false;
        this.dialogRef.close({
          accion: this.esEdicion ? 'editado' : 'registrado',
          institucion,
        });
      },
      error: (err) => {
        this.guardando = false;
        this.errorMensaje = err?.error?.message || 'No se pudo guardar la institución';
      },
    });
  }

  cancelar() {
    this.dialogRef.close();
  }
}
