import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  PermisoCatalogo,
  Rol,
  RolesService,
} from '../../../../services/usuarios/roles.service';

interface DialogRolData {
  rol?: Rol;
}

interface GrupoPermisos {
  recurso: string;
  etiqueta: string;
  permisos: PermisoCatalogo[];
}

const ETIQUETAS_RECURSO: Record<string, string> = {
  tramite: 'Trámites',
  archivo: 'Archivos',
  usuario: 'Usuarios',
  rol: 'Roles',
  tipo_tramite: 'Tipos de trámite',
  clasificacion_tramite: 'Clasificaciones',
  institucion: 'Instituciones',
  ambiente_fisico: 'Ambientes',
  estante_fisico: 'Estantes',
  ubicacion_fisica: 'Ubicaciones físicas',
  movimiento_fisico: 'Movimientos de archivos',
  reporte_tramite: 'Reportes de trámites',
};

const ETIQUETAS_ACCION: Record<string, string> = {
  ver: 'Ver',
  crear: 'Agregar',
  editar: 'Editar',
  eliminar: 'Eliminar',
  descargar: 'Descargar',
  agregar: 'Agregar',
  desactivar: 'Desactivar',
  aplicar_sello: 'Aplicar sello',
  asignar: 'Asignar',
  reubicar: 'Reubicar',
  liberar: 'Liberar',
  registrar: 'Registrar',
  aplicar: 'Aplicar',
  generar: 'Generar',
  cambiar_estado: 'Cambiar estado',
  acceso_global: 'Acceder a todas las instituciones',
};

@Component({
  selector: 'app-dialog-rol',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './dialog-rol.component.html',
  styleUrl: './dialog-rol.component.scss',
})
export class DialogRolComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rolesService = inject(RolesService);
  private readonly dialogRef = inject(MatDialogRef<DialogRolComponent>);
  readonly data = inject<DialogRolData>(MAT_DIALOG_DATA, { optional: true });

  readonly rol = this.data?.rol;
  readonly esEdicion = !!this.rol;
  readonly form = this.fb.nonNullable.group({
    nombre: [this.rol?.nombre ?? '', [Validators.required, Validators.maxLength(100)]],
    descripcion: [this.rol?.descripcion ?? '', Validators.maxLength(300)],
  });

  grupos: GrupoPermisos[] = [];
  seleccionados = new Set<string>();
  cargandoCatalogo = true;
  guardando = false;
  errorMensaje: string | null = null;

  ngOnInit(): void {
    for (const permiso of this.rol?.permisos ?? []) {
      this.seleccionados.add(this.clave(permiso));
    }

    this.rolesService.getCatalogoPermisos().subscribe({
      next: (catalogo) => {
        this.grupos = this.agruparPermisos(catalogo);
        this.cargandoCatalogo = false;
      },
      error: (error) => {
        this.cargandoCatalogo = false;
        this.errorMensaje =
          error?.error?.message ?? 'No se pudo cargar el catálogo de permisos';
      },
    });
  }

  estaSeleccionado(permiso: PermisoCatalogo): boolean {
    return this.seleccionados.has(this.clave(permiso));
  }

  cambiarSeleccion(permiso: PermisoCatalogo, seleccionado: boolean): void {
    const clave = this.clave(permiso);
    seleccionado
      ? this.seleccionados.add(clave)
      : this.seleccionados.delete(clave);
  }

  seleccionarGrupo(grupo: GrupoPermisos, seleccionado: boolean): void {
    for (const permiso of grupo.permisos) {
      this.cambiarSeleccion(permiso, seleccionado);
    }
  }

  grupoCompleto(grupo: GrupoPermisos): boolean {
    return grupo.permisos.every((permiso) => this.estaSeleccionado(permiso));
  }

  etiquetaAccion(permiso: PermisoCatalogo): string {
    if (permiso.recurso === 'tramite' && permiso.accion === 'crear') {
      return 'Registrar';
    }
    return (
      ETIQUETAS_ACCION[permiso.accion] ??
      permiso.accion.replaceAll('_', ' ')
    );
  }

  guardar(): void {
    if (this.form.invalid || this.guardando || this.cargandoCatalogo) {
      this.form.markAllAsTouched();
      return;
    }

    const permisos = this.grupos
      .flatMap((grupo) => grupo.permisos)
      .filter((permiso) => this.estaSeleccionado(permiso));
    const valor = this.form.getRawValue();
    const datos = {
      nombre: valor.nombre.trim(),
      descripcion: valor.descripcion.trim() || null,
      permisos,
    };

    this.guardando = true;
    this.errorMensaje = null;
    const request = this.rol
      ? this.rolesService.actualizarRol(this.rol.id, datos)
      : this.rolesService.crearRol(datos);

    request.subscribe({
      next: () => this.dialogRef.close({ guardado: true }),
      error: (error) => {
        this.guardando = false;
        this.errorMensaje =
          error?.error?.message ?? 'No se pudo guardar el rol';
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private agruparPermisos(catalogo: PermisoCatalogo[]): GrupoPermisos[] {
    const grupos = new Map<string, PermisoCatalogo[]>();
    for (const permiso of catalogo) {
      grupos.set(permiso.recurso, [
        ...(grupos.get(permiso.recurso) ?? []),
        permiso,
      ]);
    }

    return Array.from(grupos, ([recurso, permisos]) => ({
      recurso,
      etiqueta: ETIQUETAS_RECURSO[recurso] ?? recurso.replaceAll('_', ' '),
      permisos,
    }));
  }

  private clave(permiso: PermisoCatalogo): string {
    return `${permiso.recurso}:${permiso.accion}`;
  }
}
