import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UsuariosService } from '../../../../../components/services/usuarios/usuarios.service';

const passwordsCoinciden: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const passwordNueva = control.get('password_nueva')?.value;
  const confirmacion = control.get('confirmar_password_nueva')?.value;
  return passwordNueva && confirmacion && passwordNueva !== confirmacion
    ? { passwordsNoCoinciden: true }
    : null;
};

@Component({
  selector: 'app-cambiar-password',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './cambiar-password.component.html',
  styleUrl: './cambiar-password.component.scss',
})
export class CambiarPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly usuariosService = inject(UsuariosService);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      password_actual: ['', [Validators.required, Validators.minLength(5)]],
      password_nueva: [
        '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(72)],
      ],
      confirmar_password_nueva: [
        '',
        [Validators.required, Validators.minLength(5), Validators.maxLength(72)],
      ],
    },
    { validators: passwordsCoinciden },
  );

  mostrarActual = false;
  mostrarNueva = false;
  mostrarConfirmacion = false;
  guardando = false;
  mensaje: string | null = null;
  esError = false;

  actualizarPassword(): void {
    if (this.passwordForm.invalid || this.guardando) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.mensaje = null;
    this.esError = false;

    this.usuariosService
      .cambiarPassword(this.passwordForm.getRawValue())
      .subscribe({
        next: (respuesta) => {
          this.guardando = false;
          this.mensaje = respuesta.message;
          this.passwordForm.reset();
        },
        error: (error) => {
          this.guardando = false;
          this.esError = true;
          this.mensaje = Array.isArray(error?.error?.message)
            ? error.error.message.join('. ')
            : error?.error?.message || 'No se pudo actualizar la contraseña.';
        },
      });
  }
}
