import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ComprobantePagoService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);


  getAll() {
    return this.http.get<any[]>(`${this.apiUrl}/comprobante-pago`);
  }

  getOne(id: number) {
    return this.http.get<any>(`${this.apiUrl}/comprobante-pago/${id}`);
  }

  create(data: {
    numero_comprobante: string;
    monto: number;
    concepto: string | null;
    tramite_id: number;
  }) {
    return this.http.post(`${this.apiUrl}/comprobante-pago`, data);
  }

  update(
    id: number,
    data: {
      numero_comprobante: string;
      monto: number;
      concepto: string | null;
    },
  ) {
    return this.http.patch(`${this.apiUrl}/comprobante-pago/${id}`, data);
  }
}
