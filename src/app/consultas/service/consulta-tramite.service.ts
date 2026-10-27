import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

export interface MensajeRasa {
  recipient_id?: string;
  text?: string;
  image?: string;
  buttons?: unknown[];
  custom?: unknown;
}

export interface RespuestaAgente {
  respuestas: MensajeRasa[];
}

export interface RespuestaTranscripcion {
  texto_original: string;
  texto_normalizado: string;
  texto: string;
  codigo_detectado: string | null;
  codigo_valido: boolean;
  cantidad_bloques: number | null;
  advertencia: string | null;
  idioma: string;
  probabilidad_idioma: number;
  duracion_segundos: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConsultaTramiteService {

  private readonly apiUrl = environment.apiUrl;
  private readonly http = inject(HttpClient);

  enviarMensaje(
    mensaje: string,
  ): Observable<RespuestaAgente> {
    return this.http.post<RespuestaAgente>(
      `${this.apiUrl}/agente/mensaje`,
      { mensaje },
    );
  }

  transcribirAudio(
    audio: Blob,
  ): Observable<RespuestaTranscripcion> {
    const formulario = new FormData();

    formulario.append(
      'audio',
      audio,
      this.obtenerNombreAudio(audio.type),
    );

    return this.http.post<RespuestaTranscripcion>(
      `${this.apiUrl}/agente/transcribir`,
      formulario,
    );
  }

  sintetizarTexto(
    texto: string,
  ): Observable<Blob> {
    return this.http.post(
      `${this.apiUrl}/agente/sintetizar`,
      { texto },
      {
        responseType: 'blob',
      },
    );
  }

  private obtenerNombreAudio(
    tipoMime: string,
  ): string {
    if (tipoMime.includes('mp4')) {
      return 'grabacion.mp4';
    }

    if (tipoMime.includes('ogg')) {
      return 'grabacion.ogg';
    }

    if (tipoMime.includes('wav')) {
      return 'grabacion.wav';
    }

    return 'grabacion.webm';
  }
}
