import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../../auth/services/auth.service';
import { AmbienteFisicoService } from '../../../../services/gestion-tramites/control-fisico/ambiente-fisico.service';
import { DialogAmbienteFisicoComponent } from './dialog-ambiente-fisico/dialog-ambiente-fisico.component';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-ambiente-fisico',
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
  templateUrl: './ambiente-fisico.component.html',
})
export class AmbienteFisicoComponent implements OnInit {
  private readonly service = inject(AmbienteFisicoService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  ambientes: any[] = [];
  totalRegistros = 0;
  pageIndex = 0;
  pageSize = 10;
  busqueda = '';
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>;
  readonly pageSizeOptions = [10, 20, 50, 100];

  get esAdministradorGeneral(): boolean {
    return this.authService.tienePermiso('institucion', 'acceso_global');
  }

  get puedeCrear(): boolean {
    return this.authService.tienePermiso('ambiente_fisico', 'crear');
  }

  get puedeEditar(): boolean {
    return this.authService.tienePermiso('ambiente_fisico', 'editar');
  }

  get displayedColumns(): string[] {
    const columnas = this.esAdministradorGeneral
      ? ['nro', 'nombre', 'institucion', 'estado']
      : ['nro', 'nombre', 'estado'];
    return this.puedeEditar ? [...columnas, 'opciones'] : columnas;
  }

  ngOnInit(): void {
    this.cargarAmbientes();
  }

  cargarAmbientes(): void {
    this.service
      .getPaginated(this.pageIndex + 1, this.pageSize, this.busqueda)
      .subscribe({
      next: (respuesta) => {
        this.ambientes = respuesta.data ?? [];
        this.totalRegistros = respuesta.meta.total;
      },
      error: (error) => console.error(error),
    });
  }

  buscar(): void {
    clearTimeout(this.temporizadorBusqueda);
    this.pageIndex = 0;
    this.cargarAmbientes();
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
    this.cargarAmbientes();
  }

  agregar(): void {
    this.abrirDialogo();
  }

  editar(ambiente: any): void {
    this.abrirDialogo(ambiente);
  }

  private abrirDialogo(ambiente?: any): void {
    const dialogRef = this.dialog.open(DialogAmbienteFisicoComponent, {
      width: '500px',
      data: ambiente ? { ambiente } : null,
    });
    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado?.accion) {
        this.cargarAmbientes();
      }
    });
  }
}
