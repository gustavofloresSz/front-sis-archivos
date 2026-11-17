import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClasificacionTramiteService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/clasificacion-tramite`);
  }

  getPaginated(page: number, limit: number, search = '') {
    return this.http.get<{
      data: any[];
      meta: { page: number; limit: number; total: number; lastPage: number };
    }>(`${this.apiUrl}/clasificacion-tramite/paginado`, {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });
  }

  create(data: { nombre: string; estado?: boolean }) {
    return this.http.post<any>(`${this.apiUrl}/clasificacion-tramite`, data);
  }

  update(id: number, data: { nombre?: string; estado?: boolean }) {
    return this.http.patch<any>(
      `${this.apiUrl}/clasificacion-tramite/${id}`,
      data,
    );
  }
}
