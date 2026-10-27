import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { nombreArchivo } from '../../../../shared/archivos/archivo-presentacion';
import { formatearFechaIso } from '../../../../shared/presentacion/fecha-presentacion';
import { describirUbicacionFisica } from '../../../../shared/presentacion/ubicacion-fisica-presentacion';
import { buscarElementoPorId } from '../../shared/seleccion-catalogo.utils';

@Component({
  selector: 'app-confirmacion-step',
  imports: [
    CommonModule,
  ],
  template: `
    <div class="pt-5">
      <h3 class="mb-4 text-lg font-semibold text-gray-800">Resumen del trámite</h3>

      <dl class="grid grid-cols-1 gap-x-6 gap-y-4 rounded-lg bg-gray-50 p-5 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Folder</dt>
          <dd>
            {{ esEdicion() ? valor(datosGeneralesForm(), 'num_folder') : 'Se asignará automáticamente' }}
          </dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">N° trámite</dt>
          <dd>{{ valor(datosGeneralesForm(), 'num_tramite') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Gestión</dt>
          <dd>{{ valor(datosGeneralesForm(), 'gestion') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Solicitante</dt>
          <dd>{{ valor(datosGeneralesForm(), 'nombres_apellidos') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Zona</dt>
          <dd>{{ valor(datosGeneralesForm(), 'zona') || 'Sin zona' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Distrito</dt>
          <dd>{{ valor(datosGeneralesForm(), 'distrito') || 'Sin distrito' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Matrícula</dt>
          <dd>{{ valor(datosGeneralesForm(), 'matricula') || 'Sin matrícula' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Código catastral</dt>
          <dd>{{ valor(datosGeneralesForm(), 'codigo_catastral') || 'Sin código' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Fecha de resolución</dt>
          <dd>{{ formatearFecha(valor(datosGeneralesForm(), 'fecha_resolucion')) || 'Sin fecha' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Resolución municipal</dt>
          <dd>{{ valor(datosGeneralesForm(), 'resolucion_municipal') || 'Sin resolución' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">
            Fecha resolución complementaria/aclaratoria
          </dt>
          <dd>
            {{
              formatearFecha(
                valor(datosGeneralesForm(), 'fecha_resolucion_complementaria_aclaratoria')
              ) || 'Sin fecha'
            }}
          </dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">
            Resolución complementaria/aclaratoria
          </dt>
          <dd>
            {{
              valor(datosGeneralesForm(), 'resolucion_complementaria_aclaratoria') ||
              'Sin resolución complementaria/aclaratoria'
            }}
          </dd>
        </div>

        <div class="md:col-span-2 lg:col-span-3">
          <dt class="text-xs font-semibold uppercase text-gray-500">Descripción</dt>
          <dd>{{ valor(datosGeneralesForm(), 'descripcion') || 'Sin descripción' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Segmento</dt>
          <dd>{{ tipoTramiteSeleccionado()?.segmento || 'Sin segmento' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Tipo de trámite</dt>
          <dd>{{ tipoTramiteSeleccionado()?.nombre || 'Sin selección' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Clasificación</dt>
          <dd>{{ clasificacionSeleccionada()?.nombre || 'Sin selección' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">
            {{ esEdicion() ? 'Estado actual' : 'Estado posterior al registro' }}
          </dt>
          <!-- <dd>
            {{ estadoSeleccionado()?.nombre || (esEdicion() ? 'Sin selección' : 'Sin cambio posterior') }}
          </dd> -->
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Superficie aprobada</dt>
          <dd>{{ formatearSuperficie('sup_aprobada') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Superficie construida</dt>
          <dd>{{ formatearSuperficie('sup_construida') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Superficie afectada</dt>
          <dd>{{ formatearSuperficie('sup_afectada') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Superficie avance</dt>
          <dd>{{ formatearSuperficie('sup_avance') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Área verde</dt>
          <dd>{{ formatearSuperficie('sup_area_verde') }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Ubicación física</dt>
          <dd>{{ describirUbicacion(ubicacionSeleccionada()) }}</dd>
        </div>

        <div class="md:col-span-2 lg:col-span-3">
          <dt class="text-xs font-semibold uppercase text-gray-500">Observaciones</dt>
          <dd>{{ valor(archivoUbicacionForm(), 'observaciones') || 'Sin observaciones' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Comprobante</dt>
          <dd>{{ valor(comprobantePagoForm(), 'numero_comprobante') || 'Sin comprobante' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Monto</dt>
          <dd>{{ valor(comprobantePagoForm(), 'monto_comprobante') ?? 'Sin monto' }}</dd>
        </div>

        <div>
          <dt class="text-xs font-semibold uppercase text-gray-500">Concepto</dt>
          <dd>{{ valor(comprobantePagoForm(), 'concepto_comprobante') || 'Sin concepto' }}</dd>
        </div>

        <div class="md:col-span-2 lg:col-span-3">
          <dt class="text-xs font-semibold uppercase text-gray-500">Archivos</dt>
          <dd>
            @if (esEdicion() && archivosExistentes().length) {
              <ul class="mt-1 list-disc pl-5">
                @for (archivo of archivosExistentes(); track archivo.id) {
                  <li [class.text-amber-700]="archivoEstaRetirado(archivo.id)">
                    {{ nombreArchivo(archivo) }}
                    @if (archivoEstaRetirado(archivo.id)) {
                      (se retirará)
                    }
                  </li>
                }
              </ul>
            }

            @if (archivosSeleccionados().length) {
              @if (esEdicion()) {
                <p class="mb-0 mt-2 font-medium text-blue-700">Archivos nuevos:</p>
              }
              <ul class="mt-1 list-disc pl-5">
                @for (archivo of archivosSeleccionados(); track $index) {
                  <li>{{ archivo.name }}</li>
                }
              </ul>
            }

            @if (!archivosExistentes().length && !archivosSeleccionados().length) {
              Sin archivos
            }
          </dd>
        </div>
      </dl>
    </div>
  `,
})
export class ConfirmacionStepComponent {
  datosGeneralesForm = input.required<FormGroup>();
  clasificacionForm = input.required<FormGroup>();
  superficiesForm = input.required<FormGroup>();
  archivoUbicacionForm = input.required<FormGroup>();
  comprobantePagoForm = input.required<FormGroup>();

  tiposTramite = input<any[]>([]);
  clasificacionesTramite = input<any[]>([]);
  estadosTramite = input<any[]>([]);
  ubicacionesFisicas = input<any[]>([]);
  archivosSeleccionados = input<File[]>([]);
  archivosExistentes = input<any[]>([]);
  archivosRetiradosIds = input<number[]>([]);
  esEdicion = input(false);

  valor(form: FormGroup, campo: string) {
    return form.get(campo)?.value;
  }

  formatearSuperficie(campo: string): string {
    const valor = this.valor(this.superficiesForm(), campo);

    if (valor === null || valor === undefined || valor === '') {
      return 'Sin dato';
    }

    const numero = Number(valor);
    const superficie = Number.isFinite(numero)
      ? new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(numero)
      : String(valor);

    return `${superficie} m²`;
  }

  archivoEstaRetirado(archivoId: number) {
    return this.archivosRetiradosIds().includes(archivoId);
  }

  nombreArchivo(archivo: any) {
    return nombreArchivo(archivo);
  }

  tipoTramiteSeleccionado() {
    return this.buscarPorId(
      this.tiposTramite(),
      this.valor(this.clasificacionForm(), 'tipo_tramite_id'),
    );
  }

  clasificacionSeleccionada() {
    return this.buscarPorId(
      this.clasificacionesTramite(),
      this.valor(this.clasificacionForm(), 'clasificacion_tramite_id'),
    );
  }

  estadoSeleccionado() {
    const rawValue = this.clasificacionForm().getRawValue();

    return this.buscarPorId(
      this.estadosTramite(),
      rawValue.estado_actual_id,
    );
  }

  ubicacionSeleccionada() {
    return this.buscarPorId(
      this.ubicacionesFisicas(),
      this.valor(this.archivoUbicacionForm(), 'ubicacion_fisica_id'),
    );
  }

  describirUbicacion(ubicacion: any) {
    return describirUbicacionFisica(ubicacion, {
      incluirInstitucion: false,
      etiquetarFilaColumna: false,
      textoSinDetalle: 'Ubicación sin detalle',
    });
  }

  formatearFecha(valor: unknown): string | null {
    return formatearFechaIso(valor);
  }

  private buscarPorId(items: any[], id: unknown) {
    return buscarElementoPorId(items, id);
  }

}
