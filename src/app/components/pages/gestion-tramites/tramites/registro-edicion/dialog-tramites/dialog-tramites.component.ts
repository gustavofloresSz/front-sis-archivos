import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {AbstractControl,FormBuilder,FormControl,ReactiveFormsModule,ValidationErrors,Validators,} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ClasificacionTramiteService } from '../../../../../services/gestion-tramites/catalogos/clasificacion-tramite.service';
import { EstadoTramiteService } from '../../../../../services/gestion-tramites/tramites/estado-tramite.service';
import { TipoTramiteService } from '../../../../../services/gestion-tramites/catalogos/tipo-tramite.service';
import { TramitesService, UpdateTramitePayload } from '../../../../../services/gestion-tramites/tramites/tramites.service';
import { ComprobantePagoService } from '../../../../../services/gestion-tramites/tramites/comprobante-pago.service';
import { ArchivosService } from '../../../../../services/gestion-tramites/tramites/archivos.service';
import { UbicacionFisicaService } from '../../../../../services/gestion-tramites/control-fisico/ubicacion-fisica.service';
import { DatosTramiteStepComponent } from './steps/datos-tramite-step.component';
import { ClasificacionStepComponent } from './steps/clasificacion-step.component';
import { SuperficiesStepComponent } from './steps/superficies-step.component';
import { ArchivoUbicacionStepComponent, UbicacionPendiente } from './steps/archivo-ubicacion-step.component';
import { ComprobantePagoStepComponent } from './steps/comprobante-pago-step.component';
import { ConfirmacionStepComponent } from './steps/confirmacion-step.component';
import { AmbienteFisicoService } from '../../../../../services/gestion-tramites/control-fisico/ambiente-fisico.service';
import { EstanteFisicoService } from '../../../../../services/gestion-tramites/control-fisico/estante-fisico.service';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

function validarComprobantePago(control: AbstractControl): ValidationErrors | null {
  const numero = String(control.get('numero_comprobante')?.value ?? '').trim();
  const monto = control.get('monto_comprobante')?.value;

  const tieneNumero = numero !== '';
  const tieneMonto = monto !== null && monto !== undefined && monto !== '';

  if (tieneNumero && !tieneMonto) {
    return { montoRequerido: true };
  }

  if (!tieneNumero && tieneMonto) {
    return { numeroRequerido: true };
  }

  if (tieneMonto) {
    const montoNumerico = Number(monto);

    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      return { montoInvalido: true };
    }
  }

  return null;
}

@Component({
  selector: 'app-dialog-tramites',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatStepperModule,

    DatosTramiteStepComponent,
    ClasificacionStepComponent,
    SuperficiesStepComponent,
    ArchivoUbicacionStepComponent,
    ComprobantePagoStepComponent,
    ConfirmacionStepComponent,
  ],
  templateUrl: './dialog-tramites.component.html',
  styleUrl: './dialog-tramites.component.scss',
})
export class DialogTramitesComponent implements OnInit {
 private fb = inject(FormBuilder);
  private tramitesService = inject(TramitesService);
  private comprobantePagoService = inject(ComprobantePagoService);
  private archivosService = inject(ArchivosService);
  private tipoTramiteService = inject(TipoTramiteService);
  private clasificacionTramiteService = inject(ClasificacionTramiteService);
  private estadoTramiteService = inject(EstadoTramiteService);
  private ubicacionFisicaService = inject(UbicacionFisicaService);
  private ambienteFisicoService = inject(AmbienteFisicoService);
  private estanteFisicoService = inject(EstanteFisicoService);
  private dialogRef = inject(MatDialogRef<DialogTramitesComponent>);

  data = inject(MAT_DIALOG_DATA, { optional: true });

  tramiteEditando = this.data?.tramite;
  esEdicion = !!this.tramiteEditando;

  guardando = false;
  errorMensaje: string | null = null;

  tiposTramite: any[] = [];
  clasificacionesTramite: any[] = [];
  estadosTramite: any[] = [];
  ambientesFisicos: any[] = [];
  estantesFisicos: any[] = [];
  ubicacionesFisicas: any[] = [];
  archivosSeleccionados: File[] = [];
  archivosRetiradosIds: number[] = [];
  ubicacionPendiente: UbicacionPendiente | null = null;

  readonly gestiones = Array.from(
    { length: new Date().getFullYear() - 1949 },
    (_, indice) => new Date().getFullYear() - indice,
  );

  private comprobanteEditando =
    this.tramiteEditando?.comprobantes_pago?.[0] ??
    this.tramiteEditando?.comprobante_pago ??
    this.tramiteEditando?.comprobantePago ??
    this.tramiteEditando?.comprobante ??
    {};

  tramiteForm = this.fb.group({
    datosGenerales: this.fb.group({
      codigo_tramite: new FormControl({
        value: this.tramiteEditando?.codigo_tramite ?? '',
        disabled: true,
      }),
      num_folder: new FormControl({
        value: this.tramiteEditando?.num_folder ?? null,
        disabled: true,
      }),
      num_tramite: new FormControl(
        {
          value: this.tramiteEditando?.num_tramite ?? null,
          disabled: this.esEdicion,
        },
        { validators: [Validators.required, Validators.min(1)] },
      ),
      gestion: new FormControl(
        {
          value: this.tramiteEditando?.gestion ?? null,
          disabled: this.esEdicion,
        },
        { validators: [Validators.required] },
      ),
      zona: [this.tramiteEditando?.zona ?? ''],
      distrito: [this.tramiteEditando?.distrito ?? ''],
      descripcion: [this.tramiteEditando?.descripcion ?? ''],
      nombres_apellidos: [
        this.tramiteEditando?.nombres_apellidos ?? '',
        Validators.required,
      ],
      matricula: [this.tramiteEditando?.matricula ?? ''],
      codigo_catastral: [this.tramiteEditando?.codigo_catastral ?? ''],

      fecha_resolucion: [
        this.fechaParaDatepicker(this.tramiteEditando?.fecha_resolucion),
      ],
      resolucion_municipal: [this.tramiteEditando?.resolucion_municipal ?? ''],

      fecha_resolucion_complementaria_aclaratoria: [
        this.fechaParaDatepicker(
          this.tramiteEditando?.fecha_resolucion_complementaria_aclaratoria,
        ),
      ],
      resolucion_complementaria_aclaratoria: [
        this.tramiteEditando?.resolucion_complementaria_aclaratoria ?? '',
      ],
    }),

    clasificacion: this.fb.group({
      tipo_tramite_id: [
        this.tramiteEditando?.tipo_tramite?.id ??
          this.tramiteEditando?.tipo_tramite_id ??
          null,
        Validators.required,
      ],
      clasificacion_tramite_id: [
        this.tramiteEditando?.clasificacion_tramite?.id ??
          this.tramiteEditando?.clasificacion_tramite_id ??
          null,
        Validators.required,
      ],

      /**
       * En edición representa el estado actual solo como referencia.
       * En registro se enviará al backend como estado_inicial_id.
       */
      estado_actual_id: new FormControl(
        {
          value:
            this.tramiteEditando?.estado_actual?.id ??
            this.tramiteEditando?.estado_actual_id ??
            null,
          disabled: this.esEdicion,
        },
        { validators: [Validators.required] },
      ),
    }),

    superficies: this.fb.group({
      sup_aprobada: [
        this.tramiteEditando?.sup_aprobada ?? null,
        [Validators.min(0)],
      ],
      sup_construida: [
        this.tramiteEditando?.sup_construida ?? null,
        [Validators.min(0)],
      ],
      sup_afectada: [
        this.tramiteEditando?.sup_afectada ?? null,
        [Validators.min(0)],
      ],
      sup_avance: [
        this.tramiteEditando?.sup_avance ?? null,
        [Validators.min(0)],
      ],
      sup_area_verde: [
        this.tramiteEditando?.sup_area_verde ?? null,
        [Validators.min(0)],
      ],
    }),

    archivoUbicacion: this.fb.group({
      ubicacion_fisica_id: [
        this.tramiteEditando?.ubicacion_fisica?.id ??
          this.tramiteEditando?.ubicacion_fisica_id ??
          null,
      ],
      observaciones: [this.tramiteEditando?.observaciones ?? ''],
      files: new FormControl<File[] | null>(null),
    }),

    comprobantePago: this.fb.group(
      {
        numero_comprobante: [
          this.comprobanteEditando.numero_comprobante ??
            this.tramiteEditando?.numero_comprobante ??
            '',
          this.esEdicion && this.comprobanteEditando.id
            ? Validators.required
            : [],
        ],
        monto_comprobante: [
          this.comprobanteEditando.monto ??
            this.comprobanteEditando.monto_comprobante ??
            this.tramiteEditando?.monto_comprobante ??
            null,
          this.esEdicion && this.comprobanteEditando.id
            ? Validators.required
            : [],
        ],
        concepto_comprobante: [
          this.comprobanteEditando.concepto ??
            this.comprobanteEditando.concepto_comprobante ??
            this.tramiteEditando?.concepto_comprobante ??
            '',
        ],
      },
      { validators: validarComprobantePago },
    ),
  });

  get datosGeneralesForm() {
    return this.tramiteForm.controls.datosGenerales;
  }

  get clasificacionForm() {
    return this.tramiteForm.controls.clasificacion;
  }

  get superficiesForm() {
    return this.tramiteForm.controls.superficies;
  }

  get archivoUbicacionForm() {
    return this.tramiteForm.controls.archivoUbicacion;
  }

  get comprobantePagoForm() {
    return this.tramiteForm.controls.comprobantePago;
  }

  ngOnInit() {
    this.cargarTiposTramite();
    this.cargarClasificacionesTramite();
    this.cargarEstadosTramite();
    this.cargarAmbientesFisicos();
    this.cargarEstantesFisicos();
    this.cargarUbicacionesFisicas();
  }

  cargarTiposTramite() {
    this.tipoTramiteService.getAll().subscribe({
      next: (data) => (this.tiposTramite = data ?? []),
      error: (err) => console.error(err),
    });
  }

  cargarClasificacionesTramite() {
    this.clasificacionTramiteService.getAll().subscribe({
      next: (data) => {
        const clasificacionActualId = Number(
          this.clasificacionForm.get('clasificacion_tramite_id')?.value,
        );
        this.clasificacionesTramite = (data ?? []).filter(
          (clasificacion) =>
            clasificacion.estado !== false ||
            Number(clasificacion.id) === clasificacionActualId,
        );
      },
      error: (err) => console.error(err),
    });
  }

  cargarEstadosTramite() {
    const estados$ = this.esEdicion
      ? this.estadoTramiteService.getAll()
      : this.tramitesService.getEstadosInicialesPermitidos();

    estados$.subscribe({
      next: (data) => (this.estadosTramite = data ?? []),
      error: (err) => console.error(err),
    });
  }

  cargarAmbientesFisicos() {
    this.ambienteFisicoService.getAll().subscribe({
      next: (data) => (this.ambientesFisicos = data ?? []),
      error: (err) => console.error(err),
    });
  }

  cargarEstantesFisicos() {
    this.estanteFisicoService.getAll().subscribe({
      next: (data) => (this.estantesFisicos = data ?? []),
      error: (err) => console.error(err),
    });
  }

  cargarUbicacionesFisicas() {
    this.ubicacionFisicaService.getAll().subscribe({
      next: (data) => (this.ubicacionesFisicas = data ?? []),
      error: (err) => console.error(err),
    });
  }

  avanzar(stepper: MatStepper, control: AbstractControl) {
    control.markAllAsTouched();

    if (control.valid) {
      stepper.next();
    }
  }

  actualizarArchivosSeleccionados(archivos: File[]) {
    this.archivosSeleccionados = archivos;
  }

  actualizarUbicacionPendiente(ubicacion: UbicacionPendiente | null) {
    this.ubicacionPendiente = ubicacion;
  }

  actualizarArchivosRetirados(archivoIds: number[]) {
    this.archivosRetiradosIds = archivoIds;
  }

  guardarTramite() {
    this.errorMensaje = null;

    const errorComprobante = this.obtenerErrorComprobante();

    if (errorComprobante) {
      this.errorMensaje = errorComprobante;
    }

    if (errorComprobante || this.tramiteForm.invalid) {
      this.tramiteForm.markAllAsTouched();
      return;
    }

    this.guardando = true;

    const crearUbicacion$ = this.ubicacionPendiente
      ? this.ubicacionFisicaService.create({
          ...this.ubicacionPendiente,
          estado: true,
        })
      : of(null);

    crearUbicacion$
      .pipe(
        switchMap((ubicacionCreada: any) => {
          if (ubicacionCreada?.id) {
            this.archivoUbicacionForm.controls.ubicacion_fisica_id.setValue(
              ubicacionCreada.id,
            );
          }

          return this.esEdicion
            ? this.actualizarTramiteYRelacionados()
            : this.tramitesService.create(this.construirFormDataCreacion());
        }),
      )
      .subscribe({
        next: () => {
          this.guardando = false;

          this.dialogRef.close({
            accion: this.esEdicion ? 'editado' : 'registrado',
          });
        },
        error: (err) => {
          this.guardando = false;

          this.errorMensaje =
            err?.error?.message ||
            (this.esEdicion
              ? 'No se pudo actualizar el trámite.'
              : 'No se pudo registrar el trámite.');
        },
      });
  }

  cancelar() {
    this.dialogRef.close();
  }

  private construirFormDataCreacion() {
    const valores = this.tramiteForm.getRawValue();

    const datos: Record<string, unknown> = {
      ...valores.datosGenerales,
      ...valores.clasificacion,
      ...valores.superficies,
      ubicacion_fisica_id: valores.archivoUbicacion.ubicacion_fisica_id,
      observaciones: valores.archivoUbicacion.observaciones,
      ...valores.comprobantePago,
    };

    datos['fecha_resolucion'] = this.fechaParaBackend(datos['fecha_resolucion']);

    datos['fecha_resolucion_complementaria_aclaratoria'] =
      this.fechaParaBackend(
        datos['fecha_resolucion_complementaria_aclaratoria'],
      );

    delete datos['codigo_tramite'];
    delete datos['num_folder'];

    datos['estado_inicial_id'] = datos['estado_actual_id'];

    const observacionInicial = String(datos['observaciones'] ?? '').trim();

    if (datos['estado_inicial_id'] && observacionInicial) {
      datos['motivo_estado_inicial'] = observacionInicial;
    } else {
      delete datos['motivo_estado_inicial'];
    }

    delete datos['estado_actual_id'];

    const formData = new FormData();

    Object.entries(datos).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, String(value));
      }
    });

    this.archivosSeleccionados.forEach((archivo) => {
      formData.append('files', archivo);
    });

    return formData;
  }

  private construirPayloadActualizacion(): UpdateTramitePayload {
    const valores = this.tramiteForm.getRawValue();

    return {
      nombres_apellidos: valores.datosGenerales.nombres_apellidos ?? '',
      matricula: valores.datosGenerales.matricula ?? '',
      descripcion: valores.datosGenerales.descripcion ?? '',
      zona: valores.datosGenerales.zona ?? '',
      distrito: valores.datosGenerales.distrito ?? '',
      sup_avance: valores.superficies.sup_avance,
      sup_aprobada: valores.superficies.sup_aprobada,
      sup_construida: valores.superficies.sup_construida,
      sup_afectada: valores.superficies.sup_afectada,
      sup_area_verde: valores.superficies.sup_area_verde,
      codigo_catastral: valores.datosGenerales.codigo_catastral ?? '',
      resolucion_municipal:
        valores.datosGenerales.resolucion_municipal ?? '',
      fecha_resolucion: this.fechaParaBackend(
        valores.datosGenerales.fecha_resolucion,
      ),
      resolucion_complementaria_aclaratoria:
        valores.datosGenerales.resolucion_complementaria_aclaratoria ?? '',
      fecha_resolucion_complementaria_aclaratoria: this.fechaParaBackend(
        valores.datosGenerales.fecha_resolucion_complementaria_aclaratoria,
      ),
      observaciones: valores.archivoUbicacion.observaciones ?? '',
      tipo_tramite_id: Number(valores.clasificacion.tipo_tramite_id),
      clasificacion_tramite_id: Number(
        valores.clasificacion.clasificacion_tramite_id,
      ),
      ubicacion_fisica_id: valores.archivoUbicacion.ubicacion_fisica_id,
    };
  }

  private actualizarTramiteYRelacionados() {
    return this.tramitesService
      .update(
        this.tramiteEditando.id,
        this.construirPayloadActualizacion(),
      )
      .pipe(
        switchMap(() => this.guardarComprobanteEdicion()),
        switchMap(() => this.retirarArchivosMarcados()),
        switchMap(() => this.agregarArchivosSeleccionados()),
      );
  }

  private guardarComprobanteEdicion() {
    const valores = this.comprobantePagoForm.getRawValue();
    const numeroComprobante = String(valores.numero_comprobante ?? '').trim();
    const tieneMonto =
      valores.monto_comprobante !== null &&
      valores.monto_comprobante !== undefined &&
      valores.monto_comprobante !== '';

    if (!numeroComprobante && !tieneMonto) {
      return of(null);
    }

    const comprobante = {
      numero_comprobante: numeroComprobante,
      monto: Number(valores.monto_comprobante),
      concepto: String(valores.concepto_comprobante ?? '').trim() || null,
    };

    if (this.comprobanteEditando.id) {
      return this.comprobantePagoService.update(
        this.comprobanteEditando.id,
        comprobante,
      );
    }

    return this.comprobantePagoService.create({
      ...comprobante,
      tramite_id: this.tramiteEditando.id,
    });
  }

  private retirarArchivosMarcados() {
    if (!this.archivosRetiradosIds.length) {
      return of(null);
    }

    return forkJoin(
      this.archivosRetiradosIds.map((archivoId) =>
        this.archivosService.retirarDeTramite(archivoId),
      ),
    );
  }

  private agregarArchivosSeleccionados() {
    if (!this.archivosSeleccionados.length) {
      return of(null);
    }

    return this.tramitesService.agregarArchivos(
      this.tramiteEditando.id,
      this.archivosSeleccionados,
    );
  }

  private obtenerErrorComprobante(): string | null {
    if (this.comprobantePagoForm.hasError('montoRequerido')) {
      return 'Debe ingresar el monto del comprobante.';
    }

    if (this.comprobantePagoForm.hasError('numeroRequerido')) {
      return 'Debe ingresar el número de comprobante.';
    }

    if (this.comprobantePagoForm.hasError('montoInvalido')) {
      return 'El monto del comprobante debe ser mayor a 0.';
    }

    return null;
  }

  private fechaParaDatepicker(valor: unknown): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return valor;
    }

    const fecha = String(valor).split('T')[0];
    const partes = fecha.split('-').map(Number);

    if (partes.length !== 3) {
      return null;
    }

    const [anio, mes, dia] = partes;

    if (!anio || !mes || !dia) {
      return null;
    }

    return new Date(anio, mes - 1, dia);
  }

  private fechaParaBackend(valor: unknown): string | null {
    if (!valor) {
      return null;
    }

    if (typeof valor === 'string') {
      return valor.split('T')[0];
    }

    if (!(valor instanceof Date)) {
      return null;
    }

    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
