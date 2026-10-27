import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { firstValueFrom } from 'rxjs';
import {
  ConsultaTramiteService,
  MensajeRasa,
} from '../../service/consulta-tramite.service';
import { GrabadorAudio } from '../../utils/grabador-audio';

interface Mensaje {
  texto: string;
  tipo: 'usuario' | 'bot';
}

@Component({
  selector: 'app-consulta-tramite',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './consulta-tramite.component.html',
  styleUrl: './consulta-tramite.component.scss',
})
export class ConsultaTramiteComponent
  implements AfterViewChecked, OnDestroy
{
  @ViewChild('conversacion')
  private conversacion?: ElementRef<HTMLElement>;

  private readonly consultaService = inject(ConsultaTramiteService);
  private readonly grabadorAudio = new GrabadorAudio();

  mensaje = '';
  avisoVoz = '';
  cargando = false;
  grabando = false;
  transcribiendo = false;
  lecturaAutomatica = true;
  indiceAudioActivo: number | null = null;
  indiceAudioPreparando: number | null = null;

  readonly grabacionDisponible = this.grabadorAudio.disponible();
  readonly mensajes: Mensaje[] = [
    {
      texto:
        'Hola, soy el asistente de trámites. ¿Qué información deseas consultar?',
      tipo: 'bot',
    },
  ];

  private audioActual: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private secuenciaAudio = 0;
  private desplazamientoPendiente = true;

  ngAfterViewChecked(): void {
    if (!this.desplazamientoPendiente || !this.conversacion) {
      return;
    }

    const elemento = this.conversacion.nativeElement;
    elemento.scrollTop = elemento.scrollHeight;
    this.desplazamientoPendiente = false;
  }

  async alternarGrabacion(): Promise<void> {
    if (this.grabando) {
      await this.detenerYTranscribir();
      return;
    }

    await this.iniciarGrabacion();
  }

  async iniciarGrabacion(): Promise<void> {
    if (
      this.cargando ||
      this.transcribiendo ||
      !this.grabacionDisponible
    ) {
      return;
    }

    this.detenerAudio();
    this.avisoVoz = '';

    try {
      await this.grabadorAudio.iniciar();
      this.grabando = true;
      this.avisoVoz =
        'Escuchando… Habla claramente y menciona “guion” entre los bloques del código.';
    } catch (error: unknown) {
      this.grabando = false;
      this.avisoVoz = this.obtenerMensajeError(
        error,
        'No fue posible acceder al micrófono.',
      );
    }
  }

  async detenerYTranscribir(): Promise<void> {
    if (!this.grabando) {
      return;
    }

    this.grabando = false;
    this.transcribiendo = true;
    this.avisoVoz = 'Transcribiendo audio…';

    try {
      const audio = await this.grabadorAudio.detener();
      const respuesta = await firstValueFrom(
        this.consultaService.transcribirAudio(audio),
      );

      this.mensaje =
        respuesta.texto_normalizado || respuesta.texto_original;

      this.avisoVoz = respuesta.codigo_detectado
        ? `Código detectado: ${respuesta.codigo_detectado}. Revisa la transcripción antes de enviarla.`
        : 'Transcripción lista. Revísala antes de enviarla.';
    } catch (error: unknown) {
      this.avisoVoz = this.obtenerMensajeError(
        error,
        'No fue posible transcribir el audio.',
      );
    } finally {
      this.transcribiendo = false;
    }
  }

  async enviarMensaje(): Promise<void> {
    const textoUsuario = this.mensaje.trim();

    if (
      !textoUsuario ||
      this.cargando ||
      this.transcribiendo ||
      this.grabando
    ) {
      return;
    }

    this.detenerAudio();
    this.avisoVoz = '';
    this.mensajes.push({ texto: textoUsuario, tipo: 'usuario' });
    this.mensaje = '';
    this.cargando = true;
    this.solicitarDesplazamiento();

    try {
      const respuesta = await firstValueFrom(
        this.consultaService.enviarMensaje(textoUsuario),
      );
      const respuestaBot = this.obtenerTextoRespuesta(respuesta.respuestas);

      this.mensajes.push({ texto: respuestaBot, tipo: 'bot' });
      this.solicitarDesplazamiento();

      if (this.lecturaAutomatica) {
        void this.reproducirRespuesta(
          respuestaBot,
          this.mensajes.length - 1,
        );
      }
    } catch {
      this.mensajes.push({
        texto:
          'No fue posible conectar con el asistente. Inténtalo nuevamente.',
        tipo: 'bot',
      });
      this.solicitarDesplazamiento();
    } finally {
      this.cargando = false;
    }
  }

  async alternarAudio(texto: string, indice: number): Promise<void> {
    const correspondeAlAudioActual =
      this.indiceAudioActivo === indice ||
      this.indiceAudioPreparando === indice;

    if (correspondeAlAudioActual) {
      this.detenerAudio();
      return;
    }

    await this.reproducirRespuesta(texto, indice);
  }

  async reproducirRespuesta(texto: string, indice: number): Promise<void> {
    if (!texto.trim()) {
      return;
    }

    this.detenerAudio();

    const solicitudActual = ++this.secuenciaAudio;
    this.indiceAudioPreparando = indice;
    this.avisoVoz = '';

    try {
      const audioBlob = await firstValueFrom(
        this.consultaService.sintetizarTexto(texto),
      );

      if (solicitudActual !== this.secuenciaAudio) {
        return;
      }

      const url = URL.createObjectURL(audioBlob);
      const reproductor = new Audio(url);

      this.audioUrl = url;
      this.audioActual = reproductor;
      reproductor.onended = () => this.finalizarAudio(reproductor);
      reproductor.onerror = () => {
        if (this.audioActual === reproductor) {
          this.avisoVoz = 'No fue posible reproducir la respuesta.';
        }
        this.finalizarAudio(reproductor);
      };

      await reproductor.play();

      if (solicitudActual === this.secuenciaAudio) {
        this.indiceAudioActivo = indice;
        this.indiceAudioPreparando = null;
      }
    } catch {
      if (solicitudActual !== this.secuenciaAudio) {
        return;
      }

      this.avisoVoz =
        'El navegador bloqueó o no pudo reproducir la respuesta. Usa nuevamente el botón Escuchar.';
      this.liberarAudioActual();
      this.indiceAudioPreparando = null;
    } finally {
      if (
        solicitudActual === this.secuenciaAudio &&
        this.indiceAudioPreparando === indice
      ) {
        this.indiceAudioPreparando = null;
      }
    }
  }

  alternarLecturaAutomatica(): void {
    this.lecturaAutomatica = !this.lecturaAutomatica;

    if (!this.lecturaAutomatica) {
      this.detenerAudio();
    }
  }

  detenerAudio(): void {
    this.secuenciaAudio++;

    if (this.audioActual) {
      this.audioActual.onended = null;
      this.audioActual.onerror = null;
      this.audioActual.pause();
      this.audioActual.currentTime = 0;
    }

    this.liberarAudioActual();
    this.indiceAudioActivo = null;
    this.indiceAudioPreparando = null;
  }

  audioEnReproduccion(indice: number): boolean {
    return this.indiceAudioActivo === indice;
  }

  audioEnPreparacion(indice: number): boolean {
    return this.indiceAudioPreparando === indice;
  }

  ngOnDestroy(): void {
    this.grabadorAudio.cancelar();
    this.detenerAudio();
  }

  private solicitarDesplazamiento(): void {
    this.desplazamientoPendiente = true;
  }

  private obtenerTextoRespuesta(respuestas: MensajeRasa[]): string {
    const textos = respuestas
      .map((respuesta) => respuesta.text)
      .filter(
        (texto): texto is string =>
          typeof texto === 'string' && texto.trim().length > 0,
      );

    return textos.join('\n') || 'No pude comprender la consulta.';
  }

  private finalizarAudio(reproductor: HTMLAudioElement): void {
    if (this.audioActual !== reproductor) {
      return;
    }

    this.liberarAudioActual();
    this.indiceAudioActivo = null;
  }

  private liberarAudioActual(): void {
    if (this.audioActual) {
      this.audioActual.onended = null;
      this.audioActual.onerror = null;
    }

    this.audioActual = null;

    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
  }

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return mensajePredeterminado;
  }
}
