import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { WorkflowGraficoTramiteComponent } from '../../detalle/workflow-grafico-tramite/workflow-grafico-tramite.component';
import { obtenerClasesEstadoTramite } from '../../shared/estado-tramite-presentacion';

@Component({
  selector: 'app-workflow-reporte-tramite',
  imports: [
    CommonModule,
    MatIconModule,
    WorkflowGraficoTramiteComponent,
  ],
  templateUrl: './workflow-reporte-tramite.component.html',
  styleUrl: './workflow-reporte-tramite.component.scss'
})
export class WorkflowReporteTramiteComponent {
  @Input() tramite: any | null = null;

  get historialEstados(): any[] {
    const historial = this.tramite?.historial_estados ?? [];

    if (!Array.isArray(historial)) {
      return [];
    }

    return [...historial].sort((a, b) => {
      const fechaA = new Date(a?.fecha_cambio ?? 0).getTime();
      const fechaB = new Date(b?.fecha_cambio ?? 0).getTime();

      return fechaA - fechaB;
    });
  }

  clasesEstado(nombre: unknown): string {
    return obtenerClasesEstadoTramite(nombre);
  }
}
