import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

export interface CreateMovimientoFisicoDto {
  tramite_id: number;
  tipo_movimiento: 'RETIRO' | 'DEVOLUCION' | 'TRASLADO';
  ubicacion_destino_id?: number | null;
  nombre_persona?: string | null;
  documento_persona?: string | null;
  motivo?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MovimientoFisicoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/movimiento-fisico`);
  }

  getById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/movimiento-fisico/${id}`);
  }

  getByTramite(tramiteId: number) {
    return this.http.get<any[]>(
      `${this.apiUrl}/movimiento-fisico/tramite/${tramiteId}`,
    );
  }

  create(dto: CreateMovimientoFisicoDto) {
    return this.http.post<any>(`${this.apiUrl}/movimiento-fisico`, dto);
  }

  update(id: number, dto: Partial<CreateMovimientoFisicoDto>) {
    return this.http.patch<any>(`${this.apiUrl}/movimiento-fisico/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/movimiento-fisico/${id}`);
  }

  getEstadoFisicoTramite(tramiteId: number) {
    return this.http.get(`${this.apiUrl}/movimiento-fisico/tramite/${tramiteId}/estado`,);
  }

  //para la paginacion
  buscarTramitesControlFisico(search: string, page: number, limit: number) {
    return this.http.get<any>(`${this.apiUrl}/movimiento-fisico/buscar-tramites`,{
      params: {
        search,
        page,
        limit,
      },
    },);
  }
}
