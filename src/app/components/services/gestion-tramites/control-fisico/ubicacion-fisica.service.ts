import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class UbicacionFisicaService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/ubicacion-fisica`);
  }

  getById(id: number) {
    return this.http.get<any>(`${this.apiUrl}/ubicacion-fisica/${id}`);
  }

  create(data: any) {
    return this.http.post<any>(`${this.apiUrl}/ubicacion-fisica`, data);
  }

  update(id: number, data: any) {
    return this.http.patch<any>(`${this.apiUrl}/ubicacion-fisica/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<any>(`${this.apiUrl}/ubicacion-fisica/${id}`);
  }
}
