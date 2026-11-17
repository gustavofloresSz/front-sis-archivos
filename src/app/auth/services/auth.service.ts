import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap, of, map, catchError, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  token: string;
  id: number;
  nombre: string;
  rol: string;
  rol_id: number;
  permisos: PermisoAuth[];
}

export interface PermisoAuth {
  recurso: string;
  accion: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  fullname = signal<string | null>(null);
  usuarioId = signal<number | null>(null);
  rol = signal('');
  rolId = signal<number | null>(null);
  permisos = signal<PermisoAuth[]>([]);

  constructor() {
    this.checkAuthStatus().subscribe();
  }

  login(form: any): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, form).pipe(
      tap((respuesta) => this._setAuthentication(respuesta)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  checkAuthStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.logout();
      return of(false);
    }

    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/checkStatus`).pipe(
      tap((respuesta) => this._setAuthentication(respuesta)),
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('ultimaRutaAutorizada');
    this.fullname.set(null);
    this.usuarioId.set(null);
    this.rol.set('');
    this.rolId.set(null);
    this.permisos.set([]);
  }

  tienePermiso(recurso: string, accion: string): boolean {
    return this.permisos().some(
      (permiso) =>
        permiso.recurso === recurso &&
        (permiso.accion === accion || permiso.accion === 'gestionar'),
    );
  }

  private _setAuthentication(respuesta: AuthResponse) {
    localStorage.setItem('token', respuesta.token);
    this.fullname.set(respuesta.nombre);
    this.usuarioId.set(respuesta.id);
    this.rol.set(respuesta.rol);
    this.rolId.set(respuesta.rol_id);
    this.permisos.set(respuesta.permisos ?? []);
  }
}
