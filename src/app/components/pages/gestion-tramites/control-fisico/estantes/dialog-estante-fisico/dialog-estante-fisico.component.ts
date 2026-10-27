import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AmbienteFisicoService } from '../../../../../services/gestion-tramites/control-fisico/ambiente-fisico.service';
import { EstanteFisicoService } from '../../../../../services/gestion-tramites/control-fisico/estante-fisico.service';

@Component({
  selector: 'app-dialog-estante-fisico',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dialog-estante-fisico.component.html',
})
export class DialogEstanteFisicoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly estanteService = inject(EstanteFisicoService);
  private readonly ambienteService = inject(AmbienteFisicoService);
  private readonly dialogRef = inject(MatDialogRef<DialogEstanteFisicoComponent>);
  readonly data = inject<{ estante?: any }>(MAT_DIALOG_DATA, { optional: true });

  readonly estante = this.data?.estante;
  readonly esEdicion = !!this.estante;
  ambientes: any[] = [];
  cargandoAmbientes = true;
  guardando = false;
  errorMensaje: string | null = null;

  readonly form = this.fb.nonNullable.group({
    ambiente_fisico_id: [
      this.estante?.ambiente_fisico?.id ?? this.estante?.ambiente_fisico_id ?? 0,
      [Validators.required, Validators.min(1)],
    ],
    codigo: [this.estante?.codigo ?? '', [Validators.required, Validators.maxLength(30)]],
    estado: [this.estante?.estado ?? true, Validators.required],
  });

  ngOnInit(): void {
    this.cargarAmbientes();
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload: { ambiente_fisico_id: number; codigo: string; estado?: boolean } = {
      ambiente_fisico_id: Number(values.ambiente_fisico_id),
      codigo: values.codigo.trim(),
    };

    if (this.esEdicion) {
      payload.estado = values.estado;
    }

    this.guardando = true;
    this.errorMensaje = null;
    const request = this.esEdicion
      ? this.estanteService.update(this.estante.id, payload)
      : this.estanteService.create(payload);

    request.subscribe({
      next: (estante) => {
        this.guardando = false;
        this.dialogRef.close({ accion: this.esEdicion ? 'editado' : 'registrado', estante });
      },
      error: (error) => {
        this.guardando = false;
        this.errorMensaje = Array.isArray(error?.error?.message)
          ? error.error.message.join('. ')
          : error?.error?.message || 'No se pudo guardar el estante físico.';
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private cargarAmbientes(): void {
    this.ambienteService.getAll().subscribe({
      next: (ambientes) => {
        this.ambientes = ambientes ?? [];
        this.cargandoAmbientes = false;
      },
      error: () => {
        this.cargandoAmbientes = false;
        this.errorMensaje = 'No se pudieron cargar los ambientes físicos.';
      },
    });
  }
}
