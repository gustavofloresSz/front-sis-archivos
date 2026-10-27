import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

export interface ResumenWorkflowTramites {
  alcance: {
    tipo: 'institucion' | 'global';
    institucion_id: number | null;
    institucion_nombre: string | null;
  };
  indicadores: {
    total: number;
  };
  estados: Array<{
    nombre: string;
    cantidad: number;
    porcentaje: number;
    es_final: boolean;
  }>;
  transiciones: Array<{
    origen: string;
    destino: string;
    cantidad: number;
  }>;
}

export interface FiltrosResumenWorkflow {
  fechaDesde?: string;
  fechaHasta?: string;
  tipoTramiteId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  obtenerReporteTramite(tramiteId: number) {
    return this.http.get(
      `${this.apiUrl}/reportes/tramites/${tramiteId}/pdf`,
      { responseType: 'blob' },
    );
  }

  obtenerResumenWorkflow(filtros: FiltrosResumenWorkflow = {}) {
    let params = new HttpParams();

    if (filtros.fechaDesde) {
      params = params.set('fecha_desde', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      params = params.set('fecha_hasta', filtros.fechaHasta);
    }
    if (filtros.tipoTramiteId) {
      params = params.set('tipo_tramite_id', filtros.tipoTramiteId);
    }

    return this.http.get<ResumenWorkflowTramites>(
      `${this.apiUrl}/reportes/tramites/resumen-workflow`,
      { params },
    );
  }
}
