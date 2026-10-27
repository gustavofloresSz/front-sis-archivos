import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class EstadoTramiteService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/estado-tramite`);
  }
}
