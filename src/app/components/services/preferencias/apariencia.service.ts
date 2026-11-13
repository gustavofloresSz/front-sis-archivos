import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal, untracked } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';

export type Apariencia = 'claro' | 'oscuro';

@Injectable({ providedIn: 'root' })
export class AparienciaService {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly seleccion = signal<Apariencia>('claro');
  readonly actual = this.seleccion.asReadonly();

  constructor() {
    effect(() => {
      const usuarioId = this.auth.usuarioId();
      untracked(() => {
        let guardada: string | null = null;
        try {
          if (this.esNavegador && usuarioId != null) {
            guardada = this.document.defaultView?.localStorage.getItem(this.clave(usuarioId)) ?? null;
          }
        } catch { /* El almacenamiento bloqueado utiliza la apariencia clara. */ }
        // Conserva las elecciones oscuras guardadas con el nombre anterior.
        this.seleccion.set(guardada === 'oscuro' || guardada === 'institucional' ? 'oscuro' : 'claro');
      });
    });
    effect(() => this.document.documentElement.setAttribute('data-apariencia', this.actual()));
  }

  seleccionar(apariencia: Apariencia): boolean {
    if (apariencia !== 'claro' && apariencia !== 'oscuro') return false;
    this.seleccion.set(apariencia);
    const usuarioId = this.auth.usuarioId();
    try {
      if (!this.esNavegador || usuarioId == null || !this.document.defaultView) return false;
      this.document.defaultView.localStorage.setItem(this.clave(usuarioId), apariencia);
      return true;
    } catch { return false; }
  }

  private clave(usuarioId: number): string { return `tramites.apariencia.${usuarioId}`; }
}
