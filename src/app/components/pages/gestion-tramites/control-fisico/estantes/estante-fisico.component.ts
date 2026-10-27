import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../../auth/services/auth.service';
import { EstanteFisicoService } from '../../../../services/gestion-tramites/control-fisico/estante-fisico.service';
import { DialogEstanteFisicoComponent } from './dialog-estante-fisico/dialog-estante-fisico.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-estante-fisico',
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
  templateUrl: './estante-fisico.component.html',
})
export class EstanteFisicoComponent implements OnInit {
  private readonly service = inject(EstanteFisicoService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  estantes: any[] = [];
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [10, 20, 50, 100];
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;

  get esAdministradorGeneral(): boolean {
    return this.authService.tienePermiso('institucion', 'acceso_global');
  }

  get puedeCrear(): boolean {
    return this.authService.tienePermiso('estante_fisico', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('estante_fisico', 'editar');
  }

  get displayedColumns(): string[] {
    const columnas = this.esAdministradorGeneral
      ? ['nro', 'codigo', 'ambiente', 'institucion', 'estado']
      : ['nro', 'codigo', 'ambiente', 'estado'];
    return this.puedeEditar ? [...columnas, 'opciones'] : columnas;
  }

  ngOnInit(): void {
    this.cargarEstantes();
  }

  cargarEstantes(): void {
    this.service.getPaginated(this.pageIndex + 1, this.pageSize, this.busqueda).subscribe({
      next: (respuesta) => {
        this.estantes = respuesta.data ?? [];
        this.totalRegistros = respuesta.meta.total;
      },
      error: (error) => console.error(error),
    });
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarEstantes();
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
    this.cargarEstantes();
  }

  agregar(): void {
    this.abrirDialogo();
  }

  editar(estante: any): void {
    this.abrirDialogo(estante);
  }

  private abrirDialogo(estante?: any): void {
    const dialogRef = this.dialog.open(DialogEstanteFisicoComponent, {
      width: '520px',
      data: estante ? { estante } : null,
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado?.accion) {
        this.cargarEstantes();
      }
    });
  }
}
