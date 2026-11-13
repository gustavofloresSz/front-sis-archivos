import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TipoTramiteService } from '../../../../services/gestion-tramites/catalogos/tipo-tramite.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DialogTipoTramiteComponent } from './dialog-tipo-tramite/dialog-tipo-tramite.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-tipo-tramite',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatPaginatorModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './tipo-tramite.component.html',
  styleUrl: './tipo-tramite.component.scss'
})
export class TipoTramiteComponent implements OnInit {
  private tipoTramiteService = inject(TipoTramiteService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  tiposTramite: any[] = [];
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100];
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

  get puedeCrear(): boolean {
    return this.authService.tienePermiso('tipo_tramite', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('tipo_tramite', 'editar');
  }

  get displayedColumns(): string[] {
    const columnas = ['nro', 'nombre', 'segmento', 'estado'];
    return this.puedeEditar ? [...columnas, 'opciones'] : columnas;
  }

  ngOnInit(): void {
    this.cargarTiposTramite();
  }

  cargarTiposTramite() {
    this.tipoTramiteService
      .getPaginated(this.pageIndex + 1, this.pageSize, this.busqueda)
      .subscribe({
        next: (respuesta) => {
          this.tiposTramite = respuesta.data;
          this.totalRegistros = respuesta.meta.total;
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarTiposTramite();
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
    this.cargarTiposTramite();
  }

  agregarTipoTramite() {
    const dialogRef = this.dialog.open(DialogTipoTramiteComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.accion === 'registrado') {
        this.cargarTiposTramite();
      }
    });
  }

  editarTipoTramite(tipoTramite: any) {
    const dialogRef = this.dialog.open(DialogTipoTramiteComponent, {
      width: '500px',
      data: { tipoTramite },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.accion === 'editado') {
        this.cargarTiposTramite();
      }
    });
  }
}
