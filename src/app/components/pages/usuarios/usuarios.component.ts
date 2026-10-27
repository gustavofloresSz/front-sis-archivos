import { Component, inject } from '@angular/core';
import { UsuariosService } from '../../services/usuarios/usuarios.service';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DialogUsuariosComponent } from './dialogs/dialog-usuarios/dialog-usuarios.component';
import { DialogMensajeComponent } from './dialogs/dialog-mensaje/dialog-mensaje.component';
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-usuarios',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  usuarios: any[] = [];
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100];
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  esAdministradorGeneral =
    this.authService.tienePermiso('institucion', 'acceso_global');

  get puedeCrear(): boolean {
    return this.authService.tienePermiso('usuario', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('usuario', 'editar');
  }

  get displayedColumns(): string[] {
    const columnas = [
      'nro',
      'nombre_completo',
      'login',
      'rol',
      ...(this.esAdministradorGeneral ? ['institucion'] : []),
      'estado',
    ];
    return this.puedeEditar
      ? [...columnas, 'opciones']
      : columnas;
  }

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.usuariosService
      .getPaginatedUsers(this.pageIndex + 1, this.pageSize, this.busqueda)
      .subscribe({
        next: (respuesta) => {
          this.usuarios = respuesta.data ?? [];
          this.totalRegistros = respuesta.meta.total;
        },
        error: (err) => console.error('Error al obtener usuarios:', err),
      });
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarUsuarios();
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
    this.cargarUsuarios();
  }

  agregarUsuario() {
    const dialogRef = this.dialog.open(DialogUsuariosComponent, {
      width: '960px',
      data: null,
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.accion) {
        this.cargarUsuarios();
        this.mostrarMensaje('Usuario registrado');
      }
    });
  }

  editarUsuario(usuario: any) {
    const dialogRef = this.dialog.open(DialogUsuariosComponent, {
      width: '460px',
      data: { usuario },
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.accion) {
        this.cargarUsuarios();
        this.authService.checkAuthStatus().subscribe();
        this.mostrarMensaje('Usuario editado');
      }
    });
  }

  mostrarMensaje(mensaje: string) {
    this.dialog.open(DialogMensajeComponent, {
      width: '340px',
      data: { mensaje },
    });
  }

}
