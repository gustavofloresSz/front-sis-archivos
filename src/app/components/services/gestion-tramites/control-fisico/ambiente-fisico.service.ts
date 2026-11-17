import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AmbienteFisicoService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/ambiente-fisico`);
  }

  getPaginated(page = 1, limit = 10, search = '') {
    return this.http.get<{
      data: any[];
      meta: { page: number; limit: number; total: number; lastPage: number };
    }>(`${this.apiUrl}/ambiente-fisico/paginado`, {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });
  }

  getById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/ambiente-fisico/${id}`);
  }

  create(data: any) {
    return this.http.post<any>(`${this.apiUrl}/ambiente-fisico`, data);
  }

  update(id: number, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/ambiente-fisico/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/ambiente-fisico/${id}`);
  }
}
