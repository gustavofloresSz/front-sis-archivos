import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class TipoTramiteService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/tipo-tramite`);
  }

  getPaginated(page = 1, limit = 10, search = '') {
    return this.http.get<{
      data: any[];
      meta: {
        page: number;
        limit: number;
        total: number;
        lastPage: number;
      };
    }>(`${this.apiUrl}/tipo-tramite/paginado`, {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });
  }

  create(data: any) {
    return this.http.post(`${this.apiUrl}/tipo-tramite`,data,);
  }

  update(id: number, data: any) {
    return this.http.patch(`${this.apiUrl}/tipo-tramite/${id}`,data,);
  }

  delete(id: number) {
    return this.http.delete(`${this.apiUrl}/tipo-tramite/${id}`,);
  }
}
