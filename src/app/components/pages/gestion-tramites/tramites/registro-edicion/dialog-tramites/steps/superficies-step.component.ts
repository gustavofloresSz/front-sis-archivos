import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-superficies-step',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div [formGroup]="form()" class="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2 lg:grid-cols-3">
      <mat-form-field appearance="outline">
        <mat-label>Superficie aprobada</mat-label>
        <input matInput type="number" min="0" step="0.01" formControlName="sup_aprobada">
        <span matSuffix class="pr-2 text-sm text-gray-500">m²</span>
        <mat-error>La superficie no puede ser negativa</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Superficie construida</mat-label>
        <input matInput type="number" min="0" step="0.01" formControlName="sup_construida">
        <span matSuffix class="pr-2 text-sm text-gray-500">m²</span>
        <mat-error>La superficie no puede ser negativa</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Superficie afectada</mat-label>
        <input matInput type="number" min="0" step="0.01" formControlName="sup_afectada">
        <span matSuffix class="pr-2 text-sm text-gray-500">m²</span>
        <mat-error>La superficie no puede ser negativa</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Superficie de avance</mat-label>
        <input matInput type="number" min="0" step="0.01" formControlName="sup_avance">
        <span matSuffix class="pr-2 text-sm text-gray-500">m²</span>
        <mat-error>La superficie no puede ser negativa</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Superficie de área verde</mat-label>
        <input matInput type="number" min="0" step="0.01" formControlName="sup_area_verde">
        <span matSuffix class="pr-2 text-sm text-gray-500">m²</span>
        <mat-error>La superficie no puede ser negativa</mat-error>
      </mat-form-field>
    </div>
  `,
})
export class SuperficiesStepComponent {
  form = input.required<FormGroup>();
}
