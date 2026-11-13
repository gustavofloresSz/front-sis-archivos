import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface UpdateTramitePayload {
  nombres_apellidos?: string;
  matricula?: string;
  descripcion?: string;
  zona?: string;
  distrito?: string;
  manzano?: string | null;
  lote?: string | null;
  superficie?: number | null;
  sup_avance?: number | null;
  sup_aprobada?: number | null;
  sup_construida?: number | null;
  sup_afectada?: number | null;
  sup_area_verde?: number | null;
  codigo_catastral?: string;
  resolucion_municipal?: string;
  fecha_resolucion?: string | null;
  resolucion_complementaria_aclaratoria?: string;
  fecha_resolucion_complementaria_aclaratoria?: string | null;
  observaciones?: string;
  tipo_tramite_id?: number;
  clasificacion_tramite_id?: number;
  ubicacion_fisica_id?: number | null;
}

export interface TransicionEstadoTramite {
  estado: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    es_final: boolean;
  };
  es_correccion_administrativa: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TramitesService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  create(formData: FormData) {
    return this.http.post(`${this.apiUrl}/tramites/create`, formData);
  }

  //paginacion
  getAll(page = 1, limit = 10, search = '') {
    let params = new HttpParams()
      .set('page', page)
      .set('limit', limit);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<any>(`${this.apiUrl}/tramites`, { params });
  }
  getById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/tramites/${id}`);
  }

  
  update(id: number, data: UpdateTramitePayload) {
    return this.http.patch(`${this.apiUrl}/tramites/update/${id}`, data);
  }

  agregarArchivos(tramiteId: number, archivos: File[]) {
    const formData = new FormData();
    archivos.forEach((archivo) => formData.append('files', archivo));

    return this.http.post<any>(
      `${this.apiUrl}/tramites/${tramiteId}/archivos`,
      formData,
    );
  }

  //workflow
  getEstadosInicialesPermitidos() {
    return this.http.get<any[]>(`${this.apiUrl}/tramites/workflow/estados-iniciales`);
  }

  cambiarEstadoTramite(
    tramiteId: number,
    data: {
      estado_nuevo_id: number;
      motivo: string;
      es_correccion_administrativa?: boolean;
    },
  ) {
    return this.http.patch<any>(
      `${this.apiUrl}/tramites/${tramiteId}/cambiar-estado`,
      data,
    );
  }

  getHistorialEstadosTramite(tramiteId: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/tramites/${tramiteId}/historial-estados`,
    );
  }

  getEstadosPermitidos(tramiteId: number) {
    return this.http.get<{
      estado_actual: any;
      transiciones: TransicionEstadoTramite[];
    }>(`${this.apiUrl}/tramites/${tramiteId}/estados-permitidos`);
  }

  gestionarTramite(
    tramiteId: number,
    transicion: TransicionEstadoTramite,
    motivo: string,
    archivos: File[],
  ) {
    const formData = new FormData();
    formData.append('estado_nuevo_id', String(transicion.estado.id));
    formData.append('motivo', motivo.trim());

    if (transicion.es_correccion_administrativa) {
      formData.append('es_correccion_administrativa', 'true');
    }

    archivos.forEach((archivo) => formData.append('files', archivo));

    return this.http.patch<any>(
      `${this.apiUrl}/tramites/${tramiteId}/gestionar`,
      formData,
    );
  }
}
