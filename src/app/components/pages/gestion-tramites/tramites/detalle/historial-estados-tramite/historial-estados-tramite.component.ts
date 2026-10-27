import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { obtenerClasesEstadoTramite } from '../../shared/estado-tramite-presentacion';
import { nombreResponsableEstado } from '../../shared/historial-estado-presentacion';

@Component({
  selector: 'app-historial-estados-tramite',
  imports: [CommonModule, MatIconModule],
  templateUrl: './historial-estados-tramite.component.html',
})
export class HistorialEstadosTramiteComponent {
  @Input() tramite: any | null = null;

  get historial(): any[] {
    const historial = this.tramite?.historial_estados;
    if (!Array.isArray(historial)) {
      return [];
    }

    return [...historial].sort((a, b) => {
      const fechaA = new Date(a?.fecha_cambio ?? 0).getTime();
      const fechaB = new Date(b?.fecha_cambio ?? 0).getTime();
      return fechaB - fechaA;
    });
  }

  responsable(item: any): string {
    return nombreResponsableEstado(item);
  }

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }
}
