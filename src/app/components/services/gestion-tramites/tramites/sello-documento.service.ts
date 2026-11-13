import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';

export interface AplicarSelloDocumentoResponse {
  message: string;
  archivo: any;
}

export const TIPOS_SELLO = [
  { valor: 'plano', etiqueta: 'Plano' },
  { valor: 'resolucion', etiqueta: 'Resolución' },
] as const;

export type TipoSello = (typeof TIPOS_SELLO)[number]['valor'];

@Injectable({
  providedIn: 'root',
})
export class SelloDocumentoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  aplicar(archivoId: number, tiposSello: TipoSello[]) {
    return this.http.post<AplicarSelloDocumentoResponse>(
      `${this.apiUrl}/sello-documento/aplicar`,
      { archivo_id: archivoId, tipos_sello: tiposSello },
    );
  }
}
