import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { formatearFechaHora } from '../../../shared/presentacion/fecha-presentacion';
import {
  describirAmbienteFisico,
  describirEstanteFisico,
  describirFilaColumnaFisica,
  describirInstitucionFisica,
  describirUbicacionFisica,
} from '../../../shared/presentacion/ubicacion-fisica-presentacion';
import {
  claseEstadoFisicoActual,
  describirPersonaMovimiento,
  describirUsuarioMovimiento,
  estadoFisicoActual,
  textoTipoMovimiento,
  ultimoMovimientoFisico,
} from '../../shared/movimiento-fisico-presentacion';

@Component({
  selector: 'app-dialog-detalle-fisico',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './dialog-detalle-fisico.component.html',
  styleUrl: './dialog-detalle-fisico.component.scss'
})
export class DialogDetalleFisicoComponent {
  private dialogRef = inject(MatDialogRef<DialogDetalleFisicoComponent>);

  data = inject(MAT_DIALOG_DATA, { optional: true });

  tramite = this.data?.tramite;
  historial: any[] = this.data?.historial ?? [];

  get ultimoMovimiento(): any | null {
    return ultimoMovimientoFisico(this.historial);
  }

  get estadoFisicoActual(): string {
    return estadoFisicoActual(this.tramite, this.historial);
  }

  get claseEstadoFisico(): string {
    return claseEstadoFisicoActual(this.estadoFisicoActual);
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  describirUbicacion(ubicacion: any): string {
    return describirUbicacionFisica(ubicacion);
  }

  describirInstitucion(ubicacion: any): string {
    return describirInstitucionFisica(ubicacion);
  }

  describirAmbiente(ubicacion: any): string {
    return describirAmbienteFisico(ubicacion);
  }

  describirEstante(ubicacion: any): string {
    return describirEstanteFisico(ubicacion);
  }

  describirFilaColumna(ubicacion: any): string {
    return describirFilaColumnaFisica(ubicacion);
  }

  describirPersonaMovimiento(movimiento: any): string {
    return describirPersonaMovimiento(movimiento);
  }

  describirUsuario(usuario: any): string {
    return describirUsuarioMovimiento(usuario);
  }

  textoTipoMovimiento(tipo: string): string {
    return textoTipoMovimiento(tipo, 'Sin movimiento');
  }

  formatearFecha(fecha: string | Date | null): string {
    return formatearFechaHora(fecha);
  }
}
