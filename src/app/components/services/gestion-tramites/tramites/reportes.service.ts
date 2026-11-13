import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

export type CriterioReporte = 'todos' | 'solicitante' | 'institucion';

export interface InstitucionReporte { id: number; nombre: string; sigla: string; }
export interface FiltrosInstitucionReporte {
  institucion_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  buscarTramites(page: number, limit: number, search: string, criterio: CriterioReporte, filtros: FiltrosInstitucionReporte = {}) {
    let params = new HttpParams().set('page', page).set('limit', limit)
      .set('search', search).set('criterio', criterio);
    if (filtros.institucion_id) params = params.set('institucion_id', filtros.institucion_id);
    if (filtros.fecha_desde) params = params.set('fecha_desde', filtros.fecha_desde);
    if (filtros.fecha_hasta) params = params.set('fecha_hasta', filtros.fecha_hasta);
    return this.http.get<{ data: any[]; meta: { total: number } }>(
      `${this.apiUrl}/reportes/tramites`, { params },
    );
  }

  obtenerTramite(tramiteId: number) {
    return this.http.get<any>(`${this.apiUrl}/reportes/tramites/${tramiteId}`);
  }

  obtenerInstituciones() {
    return this.http.get<InstitucionReporte[]>(`${this.apiUrl}/reportes/instituciones`);
  }
}
