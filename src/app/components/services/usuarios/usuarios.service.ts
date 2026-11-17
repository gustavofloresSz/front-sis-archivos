import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  createUser(user: any) {
    return this.http.post(`${this.apiUrl}/usuarios/create`, user);
  }

  getAllUsers() {
    return this.http.get(`${this.apiUrl}/usuarios/getAll`);
  }

  getPaginatedUsers(page = 1, limit = 10, search = '') {
    return this.http.get<{
      data: any[];
      meta: {
        page: number;
        limit: number;
        total: number;
        lastPage: number;
      };
    }>(`${this.apiUrl}/usuarios/paginado`, {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });
  }

  getRolesAsignables(modo: 'crear' | 'editar') {
    return this.http.get<
      Array<{ id: number; nombre: string; descripcion: string | null }>
    >(`${this.apiUrl}/usuarios/roles-asignables/${modo}`);
  }

  updateUser(id: number, user: any) {
    return this.http.patch(`${this.apiUrl}/usuarios/update/${id}`, user);
  }

  cambiarPassword(payload: {
    password_actual: string;
    password_nueva: string;
    confirmar_password_nueva: string;
  }) {
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/usuarios/cambiar-password`,
      payload,
    );
  }
}
