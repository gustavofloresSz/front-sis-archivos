import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PermisoCatalogo {
  recurso: string;
  accion: string;
}

export interface Permiso extends PermisoCatalogo {
  id: number;
  rol_id: number;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos: Permiso[];
}

export interface GuardarRol {
  nombre: string;
  descripcion: string | null;
  permisos: PermisoCatalogo[];
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.apiUrl}/roles`);
  }

  getRolesPaginated(page = 1, limit = 10, search = '') {
    return this.http.get<{
      data: Rol[];
      meta: { page: number; limit: number; total: number; lastPage: number };
    }>(`${this.apiUrl}/roles/paginado`, {
      params: { page, limit, ...(search.trim() ? { search: search.trim() } : {}) },
    });
  }

  getCatalogoPermisos(): Observable<PermisoCatalogo[]> {
    return this.http.get<PermisoCatalogo[]>(
      `${this.apiUrl}/permisos/catalogo`,
    );
  }

  crearRol(datos: GuardarRol): Observable<Rol> {
    return this.http.post<Rol>(`${this.apiUrl}/roles`, datos);
  }

  actualizarRol(id: number, datos: GuardarRol): Observable<Rol> {
    return this.http.patch<Rol>(`${this.apiUrl}/roles/${id}`, datos);
  }
}
