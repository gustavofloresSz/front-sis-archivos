import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClasificacionTramiteService } from '../../../../services/gestion-tramites/catalogos/clasificacion-tramite.service';
import { DialogClasificacionTramiteComponent } from './dialog-clasificacion-tramite/dialog-clasificacion-tramite.component';
import { AuthService } from '../../../../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-clasificacion-tramite',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './clasificacion-tramite.component.html',
})
export class ClasificacionTramiteComponent implements OnInit {
  private readonly service = inject(ClasificacionTramiteService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  clasificaciones: any[] = [];
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100];
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

  get puedeCrear(): boolean {
    return this.authService.tienePermiso('clasificacion_tramite', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('clasificacion_tramite', 'editar');
  }

  get displayedColumns(): string[] {
    return this.puedeEditar
      ? ['nro', 'nombre', 'estado', 'opciones']
      : ['nro', 'nombre', 'estado'];
  }

  ngOnInit(): void {
    this.cargarClasificaciones();
  }

  cargarClasificaciones(): void {
    this.service
      .getPaginated(this.pageIndex + 1, this.pageSize, this.busqueda)
      .subscribe({
        next: (respuesta) => {
          this.clasificaciones = respuesta.data;
          this.totalRegistros = respuesta.meta.total;
        },
        error: (error) => console.error(error),
      });
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarClasificaciones();
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
    this.cargarClasificaciones();
  }

  agregar(): void {
    this.abrirDialogo();
  }

  editar(clasificacion: any): void {
    this.abrirDialogo(clasificacion);
  }

  private abrirDialogo(clasificacion?: any): void {
    const dialogRef = this.dialog.open(DialogClasificacionTramiteComponent, {
      width: '500px',
      data: clasificacion ? { clasificacion } : null,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado?.accion) {
        this.cargarClasificaciones();
      }
    });
  }
}
