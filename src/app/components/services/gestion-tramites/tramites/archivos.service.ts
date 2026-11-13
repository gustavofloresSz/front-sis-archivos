import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ArchivosService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/archivo`,);
  }

  verArchivo(id: number, reporteTramiteId?: number) {
    const ruta = reporteTramiteId
      ? `/reportes/tramites/${reporteTramiteId}/archivos/${id}`
      : `/archivo/ver/${id}`;
    return this.http.get(`${this.apiUrl}${ruta}`, { responseType: 'blob' });
  }

  descargarArchivo(id: number, reporteTramiteId?: number) {
    const ruta = reporteTramiteId
      ? `/reportes/tramites/${reporteTramiteId}/archivos/${id}/descargar`
      : `/archivo/descargar/${id}`;
    return this.http.get(`${this.apiUrl}${ruta}`, {
      responseType: 'blob',
    });
  }

  retirarDeTramite(id: number) {
    return this.http.delete(`${this.apiUrl}/archivo/${id}`);
  }
}
