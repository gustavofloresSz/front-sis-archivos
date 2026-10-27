import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialog-mensaje',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon [color]="data?.tipo === 'confirmacion' ? 'warn' : 'primary'">
        {{ data?.tipo === 'confirmacion' ? 'warning' : 'check_circle' }}
      </mat-icon>
      {{ data?.titulo || 'Correcto' }}
    </h2>

    <mat-dialog-content>
      <p class="text-base">{{ data.mensaje }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (data?.tipo === 'confirmacion') {
        <button mat-button (click)="cancelar()">
          Cancelar
        </button>

        <button mat-flat-button color="warn" (click)="aceptar()">
          Eliminar
        </button>

      } @else {
        <button mat-flat-button color="primary" mat-dialog-close>
          Aceptar
        </button>
      }
    </mat-dialog-actions>
  `,
})
export class DialogMensajeComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<DialogMensajeComponent>);

  aceptar() {
    this.dialogRef.close(true);
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
