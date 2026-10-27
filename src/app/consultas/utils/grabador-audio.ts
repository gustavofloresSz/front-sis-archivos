export class GrabadorAudio {
  private grabador: MediaRecorder | null = null;
  private flujo: MediaStream | null = null;
  private fragmentos: Blob[] = [];

  disponible(): boolean {
    const navegador = navigator as unknown as {
        mediaDevices?: {
        getUserMedia?: unknown;
        };
    };
    const ventana = window as unknown as {
        MediaRecorder?: unknown;
    };
    return (
        typeof navegador.mediaDevices?.getUserMedia ===
        'function' &&
        typeof ventana.MediaRecorder === 'function'
    );
    }

  async iniciar(): Promise<void> {
    if (!this.disponible()) {
      throw new Error(
        'La grabación de audio no está disponible.',
      );
    }

    if (this.grabador?.state === 'recording') {
      return;
    }

    this.flujo =
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

    const tipoMime = this.seleccionarTipoMime();

    this.fragmentos = [];

    this.grabador = tipoMime
      ? new MediaRecorder(this.flujo, {
          mimeType: tipoMime,
        })
      : new MediaRecorder(this.flujo);

    this.grabador.ondataavailable = (
      evento: BlobEvent,
    ) => {
      if (evento.data.size > 0) {
        this.fragmentos.push(evento.data);
      }
    };

    this.grabador.start();
  }

  detener(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (
        !this.grabador ||
        this.grabador.state !== 'recording'
      ) {
        reject(
          new Error('No existe una grabación activa.'),
        );
        return;
      }

      const grabadorActual = this.grabador;

      grabadorActual.onerror = () => {
        this.detenerFlujo();

        reject(
          new Error(
            'Ocurrió un error durante la grabación.',
          ),
        );
      };

      grabadorActual.onstop = () => {
        const audio = new Blob(
          this.fragmentos,
          {
            type:
              grabadorActual.mimeType ||
              'audio/webm',
          },
        );

        this.fragmentos = [];
        this.grabador = null;
        this.detenerFlujo();

        if (audio.size === 0) {
          reject(
            new Error('La grabación está vacía.'),
          );
          return;
        }

        resolve(audio);
      };

      grabadorActual.stop();
    });
  }

  cancelar(): void {
    if (
      this.grabador &&
      this.grabador.state !== 'inactive'
    ) {
      this.grabador.onstop = null;
      this.grabador.stop();
    }

    this.fragmentos = [];
    this.grabador = null;
    this.detenerFlujo();
  }

  private detenerFlujo(): void {
    this.flujo
      ?.getTracks()
      .forEach((pista) => pista.stop());

    this.flujo = null;
  }

  private seleccionarTipoMime(): string {
    const tipos = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    return (
      tipos.find((tipo) =>
        MediaRecorder.isTypeSupported(tipo),
      ) ?? ''
    );
  }
}