import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

export interface AplicarSelloDocumentoResponse {
  message: string;
  archivo: any;
}

@Injectable({
  providedIn: 'root',
})
export class SelloDocumentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  aplicar(archivoId: number) {
    return this.http.post<AplicarSelloDocumentoResponse>(
      `${this.apiUrl}/sello-documento/aplicar`,
      { archivo_id: archivoId },
    );
  }
}
