import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ArchivosService } from '../../../../../../services/gestion-tramites/tramites/archivos.service';
import { AuthService } from '../../../../../../../auth/services/auth.service';
import {
  CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE,
  acumularArchivosSeleccionados,
  esArchivoPdf,
  esArchivoTramitePermitido,
  FORMATOS_ARCHIVOS_TRAMITE,
  iconoArchivo,
} from '../../../../shared/archivos/archivo-adjunto.config';
import { descargarBlob, nombreArchivo } from '../../../../shared/archivos/archivo-presentacion';
import { describirUbicacionFisica } from '../../../../shared/presentacion/ubicacion-fisica-presentacion';
import { buscarElementoPorId } from '../../shared/seleccion-catalogo.utils';
import { VisorArchivoComponent } from '../../../../shared/archivos/visor-archivo/visor-archivo.component';

export interface UbicacionPendiente {
  estante_fisico_id: number;
  fila: string;
  columna: string;
}

@Component({
  selector: 'app-archivo-ubicacion-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    VisorArchivoComponent,
  ],
  template: `
    <div [formGroup]="form()" class="archivo-ubicacion">
      <div class="ubicacion-campos">
        <mat-form-field appearance="outline">
          <mat-label>Ambiente</mat-label>
          <mat-select [value]="ambienteFisicoId()" (selectionChange)="cambiarAmbiente($event.value)">
            <mat-option [value]="null">Sin ubicación</mat-option>

            @for (ambiente of ambientesFisicos(); track ambiente.id) {
              <mat-option [value]="ambiente.id">
                {{ ambiente.nombre }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Estante</mat-label>
          <mat-select [value]="estanteFisicoId()" (selectionChange)="cambiarEstante($event.value)" [disabled]="!ambienteFisicoId()">
            <mat-option [value]="null">Seleccione un estante</mat-option>

            @for (estante of estantesFiltrados(); track estante.id) {
              <mat-option [value]="estante.id">
                {{ estante.codigo }}
              </mat-option>
            }
          </mat-select>
          <mat-hint>Seleccione primero el ambiente.</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Fila</mat-label>
          <input matInput [value]="fila()" maxlength="20" (input)="actualizarFila($event)">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Columna</mat-label>
          <input matInput [value]="columna()" maxlength="20" (input)="actualizarColumna($event)">
        </mat-form-field>
      </div>

      @if (errorUbicacion()) {
        <div class="ubicacion-estado rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ errorUbicacion() }}
        </div>
      } @else if (ubicacionActual()) {
        <div class="ubicacion-estado rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {{ esUbicacionInicial(ubicacionActual()) ? 'Ubicación actual' : 'Ubicación disponible' }}:
          {{ describirUbicacion(ubicacionActual()) }}
        </div>
      } @else if (ubicacionPendiente()) {
        <div class="ubicacion-estado rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          La ubicación no existe todavía. Se creará al registrar el trámite:
          {{ describirUbicacionPendiente() }}
        </div>
      }

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Observaciones</mat-label>
        <textarea matInput rows="2" formControlName="observaciones"></textarea>
      </mat-form-field>

      @if (esEdicion()) {
        <div class="archivos-asociados rounded-lg border border-gray-200 p-3">
          <h4 class="mb-3 font-semibold text-gray-700">Archivos asociados</h4>

          @if (archivosExistentes().length) {
            <div class="lista-archivos space-y-2">
              @for (archivo of archivosExistentes(); track archivo.id) {
                <div
                  class="flex flex-wrap items-center justify-between gap-3 rounded bg-gray-50 px-3 py-2"
                  [class.opacity-50]="archivoEstaRetirado(archivo.id)"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <mat-icon class="shrink-0 text-sky-700">{{ iconoParaArchivo(archivo) }}</mat-icon>
                    <div class="min-w-0">
                      <p class="m-0 truncate text-sm">{{ nombreArchivo(archivo) }}</p>
                      @if (archivoEstaRetirado(archivo.id)) {
                        <p class="m-0 text-xs text-amber-700">
                          Se retirará al actualizar el trámite.
                        </p>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    @if (esPdf(archivo) && puedeVerArchivos()) {
                    <button
                      mat-stroked-button
                      type="button"
                      [disabled]="archivoEstaRetirado(archivo.id)"
                      (click)="verArchivo(archivo)"
                     class="app-button-secondary">
                      <mat-icon>visibility</mat-icon>
                      Ver
                    </button>
                    } @else if (!puedeVerArchivos()) {
                      <span class="text-xs text-slate-500">Contenido restringido</span>
                    } @else {
                      <span class="text-xs text-slate-500">Sin vista previa</span>
                    }

                    @if (puedeDescargarArchivos()) {
                      <button
                        mat-stroked-button
                        type="button"
                        [disabled]="archivoEstaRetirado(archivo.id) || descargandoArchivoId() !== null"
                        (click)="descargarArchivo(archivo)"
                       class="app-button-secondary">
                        @if (descargandoArchivoId() === archivo.id) {
                          <mat-spinner diameter="20"></mat-spinner>
                        } @else {
                          <mat-icon>download</mat-icon>
                        }
                        {{ descargandoArchivoId() === archivo.id ? 'Descargando...' : 'Descargar' }}
                      </button>
                    }

                    @if (puedeEliminarArchivos()) {
                    <button
                      mat-stroked-button
                      type="button"
                      [color]="archivoEstaRetirado(archivo.id) ? 'primary' : 'warn'"
                      (click)="alternarRetiroArchivo(archivo.id)"
                    >
                      <mat-icon>{{ archivoEstaRetirado(archivo.id) ? 'undo' : 'delete_outline' }}</mat-icon>
                      {{ archivoEstaRetirado(archivo.id) ? 'Deshacer' : 'Retirar' }}
                    </button>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="m-0 text-sm text-gray-500">No existen archivos asociados.</p>
          }

          @if (cargandoPdf()) {
            <div class="mt-4 flex items-center justify-center gap-3 rounded-lg bg-gray-50 p-5">
              <mat-spinner diameter="32"></mat-spinner>
              <span class="text-sm text-gray-600">Cargando PDF...</span>
            </div>
          }

          @if (pdfUrl()) {
            <app-visor-archivo
              [url]="pdfUrl()!"
              [nombre]="nombreArchivo(archivoEnVista())"
              altura="52vh"
              (cerrar)="cerrarPdf()"
            />
          }
        </div>
      }

      @if (puedeAgregarArchivos()) {
      <div class="carga-archivos rounded-lg border border-dashed border-gray-300 text-center">
        <mat-icon class="upload-icon text-sky-700">upload_file</mat-icon>
        <p class="mt-2 text-sm text-gray-600">
          {{ esEdicion()
            ? 'Seleccione los nuevos archivos que desea agregar al trámite.'
            : 'Seleccione archivos PDF, imágenes, Word o Excel.' }}
        </p>

        <input
          #selectorArchivos
          hidden
          name="files"
          type="file"
          multiple
          [accept]="formatosArchivosPermitidos"
          (change)="seleccionarArchivos($event)"
        >

        <button
          mat-flat-button
          color="primary"
          class="app-button-primary"
          type="button"
          (click)="selectorArchivos.click()"
        >
          <mat-icon>upload_file</mat-icon>
          Agregar archivo
        </button>

        @if (errorArchivo()) {
          <p class="mb-0 mt-3 text-sm text-red-600">{{ errorArchivo() }}</p>
        }

        @if (archivos().length) {
          <ul class="mx-auto mt-4 max-w-2xl space-y-2 text-left">
            @for (archivo of archivos(); track $index; let i = $index) {
              <li class="flex items-center justify-between gap-3 rounded bg-gray-50 px-3 py-2 text-sm">
                <span class="flex min-w-0 items-center gap-2">
                  <mat-icon class="shrink-0 text-sky-700">{{ iconoParaArchivo(archivo) }}</mat-icon>
                  <span class="truncate">{{ archivo.name }}</span>
                </span>

                <button
                  mat-icon-button
                  color="warn"
                  type="button"
                  aria-label="Quitar archivo"
                  (click)="quitarArchivo(i)"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </li>
            }
          </ul>
        } @else {
          <p class="mt-3 text-sm text-gray-500">Ningún archivo seleccionado</p>
        }
      </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .archivo-ubicacion { padding-top: 8px; }
    .ubicacion-campos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; }
    mat-form-field { min-width: 0; width: 100%; }
    .ubicacion-estado, .archivos-asociados { margin-bottom: 12px; }
    .carga-archivos { padding: 16px; }
    .carga-archivos p { margin: 8px 0; }
    .upload-icon { height: 40px; width: 40px; font-size: 40px; }
    @media (min-width: 900px) {
      .ubicacion-campos { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    @media (max-width: 599px) {
      .ubicacion-campos { grid-template-columns: 1fr; }
    }
  `,
})
export class ArchivoUbicacionStepComponent {
  private archivosService = inject(ArchivosService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  private pdfObjectUrl: string | null = null;
  private pdfSubscription?: Subscription;
  readonly formatosArchivosPermitidos = FORMATOS_ARCHIVOS_TRAMITE;

  constructor() {
    this.destroyRef.onDestroy(() => this.cerrarPdf());
  }

  form = input.required<FormGroup>();
  ambientesFisicos = input<any[]>([]);
  estantesFisicos = input<any[]>([]);
  ubicacionesFisicas = input<any[]>([]);
  esEdicion = input(false);
  ubicacionInicialId = input<number | null>(null);
  archivosExistentes = input<any[]>([]);

  archivosSeleccionadosChange = output<File[]>();
  archivosRetiradosChange = output<number[]>();
  ubicacionPendienteChange = output<UbicacionPendiente | null>();

  ambienteFisicoId = signal<number | null>(null);
  estanteFisicoId = signal<number | null>(null);
  fila = signal<string>('');
  columna = signal<string>('');

  ubicacionResuelta = signal<any | null>(null);
  ubicacionPendiente = signal<UbicacionPendiente | null>(null);
  errorUbicacion = signal<string | null>(null);
  archivos = signal<File[]>([]);
  archivosRetiradosIds = signal<number[]>([]);
  errorArchivo = signal<string | null>(null);
  cargandoPdf = signal(false);
  pdfUrl = signal<SafeResourceUrl | null>(null);
  archivoEnVista = signal<any | null>(null);
  descargandoArchivoId = signal<number | null>(null);

  puedeVerArchivos = computed(() =>
    this.authService.tienePermiso('archivo', 'ver'),
  );
  puedeAgregarArchivos = computed(() =>
    this.authService.tienePermiso('archivo', 'agregar'),
  );
  puedeEliminarArchivos = computed(() =>
    this.authService.tienePermiso('archivo', 'eliminar'),
  );
  puedeDescargarArchivos = computed(() =>
    this.puedeVerArchivos() &&
      this.authService.tienePermiso('archivo', 'descargar'),
  );

  estantesFiltrados = computed(() => {
    const ambienteId = this.ambienteFisicoId();

    if (!ambienteId) {
      return [];
    }

    return this.estantesFisicos().filter(
      (estante) => Number(estante.ambiente_fisico_id) === Number(ambienteId),
    );
  });

  ubicacionActual = computed(() => {
    const id = this.form().get('ubicacion_fisica_id')?.value;

    if (!id) {
      return this.ubicacionResuelta();
    }

    return this.buscarPorId(this.ubicacionesFisicas(), id) ?? this.ubicacionResuelta();
  });

  cambiarAmbiente(ambienteId: number | null) {
    this.ambienteFisicoId.set(ambienteId);
    this.estanteFisicoId.set(null);
    this.fila.set('');
    this.columna.set('');
    this.limpiarUbicacion();
    this.resolverUbicacionFisica();
  }

  cambiarEstante(estanteId: number | null) {
    this.estanteFisicoId.set(estanteId);
    this.limpiarUbicacion();
    this.resolverUbicacionFisica();
  }

  actualizarFila(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fila.set(this.normalizarTexto(input.value));
    this.limpiarUbicacion();
    this.resolverUbicacionFisica();
  }

  actualizarColumna(event: Event) {
    const input = event.target as HTMLInputElement;
    this.columna.set(this.normalizarTexto(input.value));
    this.limpiarUbicacion();
    this.resolverUbicacionFisica();
  }

  resolverUbicacionFisica(): boolean {
    const ambienteId = this.ambienteFisicoId();
    const estanteId = this.estanteFisicoId();
    const fila = this.fila();
    const columna = this.columna();

    const campos = [ambienteId, estanteId, fila, columna];
    const algunoCompleto = campos.some((valor) => valor !== null && valor !== undefined && String(valor).trim() !== '');
    const todosCompletos = ambienteId && estanteId && fila && columna;

    if (!algunoCompleto) {
      this.form().get('ubicacion_fisica_id')?.setValue(null, { emitEvent: false });
      this.form().setErrors(null);
      this.errorUbicacion.set(null);
      this.ubicacionResuelta.set(null);
      this.ubicacionPendiente.set(null);
      this.ubicacionPendienteChange.emit(null);
      return true;
    }

    if (!todosCompletos) {
      this.form().get('ubicacion_fisica_id')?.setValue(null, { emitEvent: false });
      this.form().setErrors({ ubicacionIncompleta: true });
      this.errorUbicacion.set('Complete ambiente, estante, fila y columna, o deje todos los campos vacíos.');
      this.ubicacionResuelta.set(null);
      this.ubicacionPendiente.set(null);
      this.ubicacionPendienteChange.emit(null);
      return false;
    }

    const ubicacion = this.ubicacionesFisicas().find((item) =>
      Number(item.estante_fisico_id) === Number(estanteId) &&
      this.normalizarTexto(item.fila) === fila &&
      this.normalizarTexto(item.columna) === columna,
    );

    if (ubicacion) {
      if (ubicacion.ocupada === true && !this.esUbicacionInicial(ubicacion)) {
        this.form().get('ubicacion_fisica_id')?.setValue(null, { emitEvent: false });
        this.form().setErrors({ ubicacionOcupada: true });
        this.errorUbicacion.set(
          'Esta ubicación física ya se encuentra ocupada por otro trámite.',
        );
        this.ubicacionResuelta.set(null);
        this.ubicacionPendiente.set(null);
        this.ubicacionPendienteChange.emit(null);
        return false;
      }

      this.form().get('ubicacion_fisica_id')?.setValue(ubicacion.id, { emitEvent: false });
      this.form().setErrors(null);
      this.errorUbicacion.set(null);
      this.ubicacionResuelta.set(ubicacion);
      this.ubicacionPendiente.set(null);
      this.ubicacionPendienteChange.emit(null);
      return true;
    }

    const pendiente: UbicacionPendiente = {
      estante_fisico_id: Number(estanteId),
      fila,
      columna,
    };

    this.form().get('ubicacion_fisica_id')?.setValue(null, { emitEvent: false });
    this.form().setErrors(null);
    this.errorUbicacion.set(null);
    this.ubicacionResuelta.set(null);
    this.ubicacionPendiente.set(pendiente);
    this.ubicacionPendienteChange.emit(pendiente);

    return true;
  }

  seleccionarArchivos(event: Event) {
    if (!this.puedeAgregarArchivos()) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const archivos = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!archivos.length) return;

    const archivoNoPermitido = archivos.find(
      (archivo) => !esArchivoTramitePermitido(archivo),
    );

    if (archivoNoPermitido) {
      this.errorArchivo.set(
        'Formato no permitido. Use PDF, imágenes JPG, PNG o WEBP, Word o Excel.',
      );
      return;
    }

    const acumulados = acumularArchivosSeleccionados(this.archivos(), archivos);
    if (acumulados.length > CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE) {
      this.errorArchivo.set(
        `Puede agregar como máximo ${CANTIDAD_MAXIMA_ARCHIVOS_TRAMITE} archivos por operación.`,
      );
      return;
    }

    this.errorArchivo.set(null);
    this.archivos.set(acumulados);
    this.sincronizarArchivos();
  }

  quitarArchivo(index: number) {
    this.errorArchivo.set(null);
    const archivos = this.archivos().filter((_, indice) => indice !== index);

    this.archivos.set(archivos);
    this.sincronizarArchivos();
  }

  alternarRetiroArchivo(archivoId: number) {
    if (!this.puedeEliminarArchivos()) {
      return;
    }

    const retirados = this.archivosRetiradosIds();
    const seRetirara = !retirados.includes(archivoId);
    const nuevosIds = retirados.includes(archivoId)
      ? retirados.filter((id) => id !== archivoId)
      : [...retirados, archivoId];

    if (seRetirara && this.archivoEnVista()?.id === archivoId) {
      this.cerrarPdf();
    }

    this.archivosRetiradosIds.set(nuevosIds);
    this.archivosRetiradosChange.emit(nuevosIds);
  }

  archivoEstaRetirado(archivoId: number) {
    return this.archivosRetiradosIds().includes(archivoId);
  }

  verArchivo(archivo: any) {
    if (!archivo?.id || !this.puedeVerArchivos()) {
      return;
    }

    this.cerrarPdf();
    this.errorArchivo.set(null);
    this.cargandoPdf.set(true);
    this.archivoEnVista.set(archivo);

    this.pdfSubscription = this.archivosService
      .verArchivo(archivo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.pdfObjectUrl = URL.createObjectURL(blob);
          this.pdfUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(
              `${this.pdfObjectUrl}#toolbar=0&navpanes=0`,
            ),
          );
          this.cargandoPdf.set(false);
        },
        error: (err) => {
          console.error(err);
          this.cargandoPdf.set(false);
          this.archivoEnVista.set(null);
          this.errorArchivo.set('No se pudo abrir el archivo PDF.');
        },
      });
  }

  descargarArchivo(archivo: any) {
    if (
      !archivo?.id ||
      !this.puedeDescargarArchivos() ||
      this.descargandoArchivoId() !== null
    ) {
      return;
    }

    this.descargandoArchivoId.set(archivo.id);
    this.errorArchivo.set(null);

    this.archivosService
      .descargarArchivo(archivo.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          descargarBlob(blob, this.nombreArchivo(archivo));
          this.descargandoArchivoId.set(null);
        },
        error: () => {
          this.descargandoArchivoId.set(null);
          this.errorArchivo.set('No se pudo descargar el archivo.');
        },
      });
  }

  cerrarPdf() {
    this.pdfSubscription?.unsubscribe();
    this.pdfSubscription = undefined;

    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
    }

    this.pdfObjectUrl = null;
    this.pdfUrl.set(null);
    this.archivoEnVista.set(null);
    this.cargandoPdf.set(false);
  }

  nombreArchivo(archivo: any) {
    return nombreArchivo(archivo);
  }

  esPdf(archivo: unknown): boolean {
    return esArchivoPdf(archivo);
  }

  iconoParaArchivo(archivo: unknown): string {
    return iconoArchivo(archivo);
  }

  describirUbicacion(ubicacion: any) {
    return describirUbicacionFisica(ubicacion, {
      incluirInstitucion: false,
      etiquetarFilaColumna: false,
      textoSinDetalle: 'Ubicación sin detalle',
    });
  }

  esUbicacionInicial(ubicacion: any): boolean {
    return (
      this.esEdicion() &&
      Number(ubicacion?.id) === Number(this.ubicacionInicialId())
    );
  }

  describirUbicacionPendiente() {
    const estante = this.buscarPorId(this.estantesFisicos(), this.estanteFisicoId());
    const ambiente = this.buscarPorId(this.ambientesFisicos(), this.ambienteFisicoId());

    return [
      this.textoCampo(ambiente?.nombre),
      this.textoCampo(estante?.codigo),
      this.fila(),
      this.columna(),
    ].filter(Boolean).join(' / ');
  }

  private sincronizarArchivos() {
    const archivos = this.archivos();

    this.form().get('files')?.setValue(archivos.length > 0 ? archivos : null);
    this.form().get('files')?.markAsTouched();
    this.form().get('files')?.updateValueAndValidity();

    this.archivosSeleccionadosChange.emit(archivos);
  }

  private limpiarUbicacion() {
    this.form().get('ubicacion_fisica_id')?.setValue(null, { emitEvent: false });
    this.ubicacionResuelta.set(null);
    this.ubicacionPendiente.set(null);
    this.ubicacionPendienteChange.emit(null);
  }

  private buscarPorId(items: any[], id: unknown) {
    return buscarElementoPorId(items, id);
  }

  private textoCampo(valor: unknown): string {
    return String(valor ?? '').trim();
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '').trim().toUpperCase();
  }
}
