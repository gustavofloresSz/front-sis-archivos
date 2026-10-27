import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Rol, RolesService } from '../../services/usuarios/roles.service';
import { DialogRolComponent } from './dialogs/dialog-rol/dialog-rol.component';
import { AuthService } from '../../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-roles',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
  ],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private readonly rolesService = inject(RolesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  roles: Rol[] = [];
  cargando = false;
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  readonly pageSizeOptions = [10, 20, 50, 100];
  get puedeCrear(): boolean {
    return this.authService.tienePermiso('rol', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('rol', 'editar');
  }

  get columnas(): string[] {
    const columnas = ['nro', 'nombre', 'descripcion', 'permisos'];
    return this.puedeEditar ? [...columnas, 'opciones'] : columnas;
  }

  ngOnInit(): void {
    this.cargarRoles();
  }

  cargarRoles(): void {
    this.cargando = true;
    this.rolesService
      .getRolesPaginated(this.pageIndex + 1, this.pageSize, this.busqueda)
      .subscribe({
      next: (respuesta) => {
        this.roles = respuesta.data ?? [];
        this.totalRegistros = respuesta.meta.total;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarMensaje(error?.error?.message ?? 'No se pudieron cargar los roles');
      },
    });
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarRoles();
  }

  buscarAlEscribir(valor: string): void {
    this.busqueda = valor;
    clearTimeout(this.temporizadorBusqueda);
    this.temporizadorBusqueda = setTimeout(() => this.buscar(), 350);
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.buscar();
  }

  cambiarPagina(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarRoles();
  }

  crear(): void {
    this.abrirDialogo();
  }

  editar(rol: Rol): void {
    this.abrirDialogo(rol);
  }

  private abrirDialogo(rol?: Rol): void {
    const dialogRef = this.dialog.open(DialogRolComponent, {
      width: '960px',
      maxWidth: '96vw',
      data: rol ? { rol } : null,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado?.guardado) {
        this.cargarRoles();
        this.authService.checkAuthStatus().subscribe();
        this.mostrarMensaje(rol ? 'Rol actualizado' : 'Rol creado');
      }
    });
  }

  private mostrarMensaje(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 3500 });
  }
}
