import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MovimientoFisicoService, CreateMovimientoFisicoDto } from '../../../../../services/gestion-tramites/control-fisico/movimiento-fisico.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { describirUbicacionFisica } from '../../../shared/presentacion/ubicacion-fisica-presentacion';


type TipoMovimientoFisico = 'RETIRO' | 'DEVOLUCION' | 'TRASLADO';
@Component({
  selector: 'app-dialog-movimiento-fisico',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,

    MatCheckboxModule
  ],
  templateUrl: './dialog-movimiento-fisico.component.html',
  styleUrl: './dialog-movimiento-fisico.component.scss'
})
export class DialogMovimientoFisicoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly movimientoFisicoService = inject(MovimientoFisicoService);
  private readonly dialogRef = inject(MatDialogRef<DialogMovimientoFisicoComponent>);

  data = inject(MAT_DIALOG_DATA, { optional: true });

  tramite = this.data?.tramite;
  estadoFisico = this.data?.estadoFisico;
  ubicacionesFisicas: any[] = this.data?.ubicacionesFisicas ?? [];

  guardando = false;
  errorMensaje: string | null = null;

  accionesPermitidas: TipoMovimientoFisico[] =
    this.estadoFisico?.acciones_permitidas ?? [];

  tiposMovimiento = [
    {
      valor: 'RETIRO' as TipoMovimientoFisico,
      etiqueta: 'Retiro',
    },
    {
      valor: 'DEVOLUCION' as TipoMovimientoFisico,
      etiqueta: 'Devolución',
    },
    {
      valor: 'TRASLADO' as TipoMovimientoFisico,
      etiqueta: 'Traslado',
    },
  ];

  form = this.fb.group({
    tipo_movimiento: [
      this.accionesPermitidas.length === 1 ? this.accionesPermitidas[0] : '',
      Validators.required,
    ],
    cambiar_ubicacion_devolucion: [false],
    ubicacion_destino_id: [null as number | null],
    nombre_persona: [''],
    documento_persona: [''],
    motivo: ['', Validators.required],
  });

  get tipoMovimiento() {
    return this.form.get('tipo_movimiento')?.value as TipoMovimientoFisico | '';
  }

  get tiposMovimientoPermitidos() {
    return this.tiposMovimiento.filter((tipo) =>
      this.accionesPermitidas.includes(tipo.valor),
    );
  }

  get estaRetirado() {
    return this.estadoFisico?.estado_fisico === 'RETIRADO';
  }

  get cambiarUbicacionDevolucion() {
    return this.form.get('cambiar_ubicacion_devolucion')?.value === true;
  }

  get mostrarUbicacionDestino() {
    if (this.tipoMovimiento === 'TRASLADO') {
      return true;
    }
    if (
      this.tipoMovimiento === 'DEVOLUCION' &&
      this.cambiarUbicacionDevolucion
    ) {
      return true;
    }
    return false;
  }

  get textoUbicacionDestino() {
    if (this.tipoMovimiento === 'TRASLADO') {
      return 'Ubicación destino';
    }
    return 'Nueva ubicación de devolución';
  }

  guardar() {
    this.errorMensaje = null;
    this.form.markAllAsTouched();

    if (!this.tramite?.id) {
      this.errorMensaje = 'No se encontró el trámite seleccionado.';
      return;
    }

    if (this.form.invalid) {
      return;
    }

    const tipoMovimiento = this.tipoMovimiento;

    if (!this.accionesPermitidas.includes(tipoMovimiento as TipoMovimientoFisico)) {
      this.errorMensaje = 'El tipo de movimiento seleccionado no está permitido.';
      return;
    }

    if (tipoMovimiento === 'TRASLADO' && !this.form.value.ubicacion_destino_id) {
      this.errorMensaje = 'Debe seleccionar la ubicación física de destino.';
      return;
    }
    if (tipoMovimiento === 'DEVOLUCION' && this.cambiarUbicacionDevolucion && !this.form.value.ubicacion_destino_id) {
      this.errorMensaje = 'Debe seleccionar la nueva ubicación de devolución.';
      return;
    }

    const enviarUbicacionDestino =
      tipoMovimiento === 'TRASLADO' ||
      (
        tipoMovimiento === 'DEVOLUCION' &&
        this.cambiarUbicacionDevolucion
      );

    const dto: CreateMovimientoFisicoDto = {
      tramite_id: Number(this.tramite.id),
      tipo_movimiento: tipoMovimiento as TipoMovimientoFisico,
      ubicacion_destino_id: enviarUbicacionDestino
        ? this.form.value.ubicacion_destino_id ?? null
        : null,
      nombre_persona: this.form.value.nombre_persona?.trim() || null,
      documento_persona: this.form.value.documento_persona?.trim() || null,
      motivo: this.form.value.motivo?.trim() || null,
    };

    this.guardando = true;

    this.movimientoFisicoService.create(dto).subscribe({
      next: () => {
        this.guardando = false;
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.guardando = false;
        this.errorMensaje =
          err?.error?.message || 'No se pudo registrar el movimiento físico.';
      },
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }

  describirUbicacion(ubicacion: any): string {
    return describirUbicacionFisica(ubicacion, {
      incluirInstitucion: false,
      etiquetarFilaColumna: false,
    });
  }

  ubicacionNoDisponible(ubicacion: any): boolean {
    const ubicacionActualId =
      this.estadoFisico?.ubicacion_fisica?.id ??
      this.tramite?.ubicacion_fisica_id;

    return (
      ubicacion?.ocupada === true ||
      Number(ubicacion?.id) === Number(ubicacionActualId)
    );
  }

  describirUltimoMovimiento(): string {
    const movimiento = this.estadoFisico?.ultimo_movimiento;

    if (!movimiento) {
      return 'Sin movimientos físicos registrados.';
    }

    return [
      movimiento.tipo_movimiento,
      movimiento.nombre_persona,
      movimiento.documento_persona,
    ].filter(Boolean).join(' - ');
  }
}
