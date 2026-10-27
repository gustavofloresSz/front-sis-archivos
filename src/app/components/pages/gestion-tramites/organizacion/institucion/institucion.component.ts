import { Component, inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InstitucionService } from '../../../../services/gestion-tramites/organizacion/institucion.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { DialogInstitucionComponent } from './dialog-institucion/dialog-institucion.component';
import { AuthService } from '../../../../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-institucion',
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
  ],
  templateUrl: './institucion.component.html',
  styleUrl: './institucion.component.scss'
})
export class InstitucionComponent implements OnInit {

  private institucionService = inject(InstitucionService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  instituciones: any[] = [];
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  readonly pageSizeOptions = [10, 20, 50, 100];

  get puedeCrear(): boolean {
    return this.authService.tienePermiso('institucion', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('institucion', 'editar');
  }

  get displayedColumns(): string[] {
    const columnas = ['nro', 'nombre', 'sigla'];
    return this.puedeEditar ? [...columnas, 'opciones'] : columnas;
  }

  ngOnInit(): void {
    this.cargarInstituciones();
  }

  cargarInstituciones() {
    this.institucionService
      .getPaginated(this.pageIndex + 1, this.pageSize, this.busqueda)
      .subscribe({
      next: (respuesta) => {
        this.instituciones = respuesta.data ?? [];
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
    this.cargarInstituciones();
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
    this.cargarInstituciones();
  }

  agregarInstitucion() {
    const dialogRef = this.dialog.open(DialogInstitucionComponent, {
      width: '440px',
      maxWidth: '94vw',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.accion === 'registrado') {
        this.cargarInstituciones();
      }
    });
  }

  editarInstitucion(institucion: any) {
    const dialogRef = this.dialog.open(DialogInstitucionComponent, {
      width: '440px',
      maxWidth: '94vw',
      data: { institucion },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.accion === 'editado') {
        this.cargarInstituciones();
      }
    });
  }

}
