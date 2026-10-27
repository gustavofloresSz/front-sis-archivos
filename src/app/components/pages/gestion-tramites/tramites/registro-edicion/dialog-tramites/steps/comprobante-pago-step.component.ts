import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-comprobante-pago-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div [formGroup]="form()" class="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2">
      <div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 md:col-span-2">
        El comprobante es opcional; si registra uno, complete número y monto.
      </div>

      <mat-form-field appearance="outline">
        <mat-label>Número de comprobante</mat-label>
        <input matInput formControlName="numero_comprobante">
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Monto</mat-label>
        <input matInput type="number" min="0.01" step="0.01" formControlName="monto_comprobante">
      </mat-form-field>

      <mat-form-field appearance="outline" class="md:col-span-2">
        <mat-label>Concepto</mat-label>
        <textarea matInput rows="3" formControlName="concepto_comprobante"></textarea>
      </mat-form-field>

      @if (form().touched && form().hasError('montoRequerido')) {
        <p class="text-sm text-red-600 md:col-span-2">Debe ingresar el monto del comprobante.</p>
      }

      @if (form().touched && form().hasError('numeroRequerido')) {
        <p class="text-sm text-red-600 md:col-span-2">Debe ingresar el número de comprobante.</p>
      }

      @if (form().touched && form().hasError('montoInvalido')) {
        <p class="text-sm text-red-600 md:col-span-2">El monto debe ser mayor a 0.</p>
      }
    </div>
  `,
})
export class ComprobantePagoStepComponent {
  form = input.required<FormGroup>();
}