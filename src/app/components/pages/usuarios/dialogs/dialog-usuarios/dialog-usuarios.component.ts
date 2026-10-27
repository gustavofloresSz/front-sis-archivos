import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsuariosService } from '../../../../services/usuarios/usuarios.service';
import { InstitucionService } from '../../../../services/gestion-tramites/organizacion/institucion.service';
import { AuthService } from '../../../../../auth/services/auth.service';

type RolAsignable = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

type UsuarioDialogData = {
  usuario?: any;
};

type InstitucionResumen = {
  id: number;
  nombre: string;
  sigla: string;
};

@Component({
  selector: 'app-dialog-usuarios',
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
  templateUrl: './dialog-usuarios.component.html',
  styleUrl: './dialog-usuarios.component.scss'
})
export class DialogUsuariosComponent {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private institucionService = inject(InstitucionService);
  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<DialogUsuariosComponent>);
  data = inject<UsuarioDialogData>(MAT_DIALOG_DATA, { optional: true });

  esAdministradorGeneral =
    this.authService.tienePermiso('institucion', 'acceso_global');
  puedeEditarDatos = this.authService.tienePermiso('usuario', 'editar');
  roles: RolAsignable[] = [];
  instituciones: InstitucionResumen[] = [];
  guardando = false;
  errorMensaje: string | null = null;
  verPassword = false;
  usuarioEditando = this.data?.usuario;
  esEdicion = !!this.usuarioEditando;
  esUsuarioActual =
    this.esEdicion && this.usuarioEditando?.id === this.authService.usuarioId();

  usuarioForm = this.fb.nonNullable.group({
    nombre_completo: [this.usuarioEditando?.nombre_completo || '', Validators.required],
    login: [this.usuarioEditando?.login || '', Validators.required],
    password: [''],
    rol_id: this.fb.control<number | null>(
      this.usuarioEditando?.rol_id ?? this.usuarioEditando?.rol?.id ?? null,
      Validators.required,
    ),
    institucion_id: this.fb.control<number | null>(
      this.usuarioEditando?.institucion_id ?? null,
    ),
    estado: [this.usuarioEditando?.estado ?? true, Validators.required],
  });

  ngOnInit() {
    this.cargarRoles();

    if (!this.esEdicion) {
      this.usuarioForm.get('password')?.addValidators(Validators.required);
      this.usuarioForm.get('password')?.updateValueAndValidity();
    } else {
      if (this.esUsuarioActual) {
        this.usuarioForm.controls.rol_id.disable();
      }

      if (!this.puedeEditarDatos) {
        this.usuarioForm.controls.nombre_completo.disable();
        this.usuarioForm.controls.login.disable();
        this.usuarioForm.controls.password.disable();
        this.usuarioForm.controls.institucion_id.disable();
      }
    }

    if (this.esAdministradorGeneral && !this.esEdicion) {
      this.usuarioForm.get('institucion_id')?.addValidators(Validators.required);
      this.usuarioForm.get('institucion_id')?.updateValueAndValidity();
      this.cargarInstituciones();
    }
  }

  guardarUsuario() {
    if (this.usuarioForm.invalid || this.guardando) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.errorMensaje = null;

    const usuario = this.construirPayload();

    const request = this.esEdicion
      ? this.usuariosService.updateUser(this.usuarioEditando.id, usuario)
      : this.usuariosService.createUser(usuario);

    request.subscribe({
      next: (usuario) => {
        this.guardando = false;
        this.dialogRef.close({
          accion: this.esEdicion ? 'editado' : 'registrado',
          usuario,
        });
      },
      error: (err) => {
        this.guardando = false;
        this.errorMensaje = err?.error?.message || 'No se pudo guardar el usuario';
        console.error('Error al guardar usuario:', err);
      },
    });
  }

  cancelar() {
    this.dialogRef.close();
  }

  mostrarPassword() {
    this.verPassword = !this.verPassword;
  }

  private cargarInstituciones(): void {
    this.institucionService.getAll().subscribe({
      next: (instituciones) => {
        this.instituciones = instituciones;
      },
      error: (err) => {
        this.errorMensaje =
          err?.error?.message || 'No se pudieron cargar las instituciones';
      },
    });
  }

  private cargarRoles(): void {
    this.usuariosService
      .getRolesAsignables(this.esEdicion ? 'editar' : 'crear')
      .subscribe({
        next: (roles) => {
          this.roles = roles;
        },
        error: (err) => {
          this.errorMensaje =
            err?.error?.message || 'No se pudieron cargar los roles';
        },
      });
  }

  private construirPayload(): Record<string, unknown> {
    const valor = this.usuarioForm.getRawValue();

    if (!this.esEdicion) {
      const { institucion_id, ...datosUsuario } = valor;
      return this.esAdministradorGeneral
        ? { ...datosUsuario, institucion_id }
        : datosUsuario;
    }

    const payload: Record<string, unknown> = {};
    if (this.puedeEditarDatos) {
      payload['nombre_completo'] = valor.nombre_completo;
      payload['login'] = valor.login;
      if (valor.password) payload['password'] = valor.password;
    }
    if (!this.esUsuarioActual) {
      payload['rol_id'] = valor.rol_id;
    }
    payload['estado'] = valor.estado;
    return payload;
  }

}
