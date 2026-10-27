import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
} from '../movimiento-fisico-presentacion';

@Component({
  selector: 'app-detalle-fisico',
  imports: [
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './detalle-fisico.component.html',
  styleUrl: './detalle-fisico.component.scss'
})
export class DetalleFisicoComponent {
  @Input() tramite: any | null = null;
  @Input() historial: any[] = [];

  get ultimoMovimiento(): any | null {
    return ultimoMovimientoFisico(this.historial);
  }

  get estadoFisicoActual(): string {
    return estadoFisicoActual(this.tramite, this.historial);
  }

  get claseEstadoFisico(): string {
    return claseEstadoFisicoActual(this.estadoFisicoActual);
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
