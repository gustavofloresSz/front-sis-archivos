import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialog-mensaje-institucion',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon color="warn">warning</mat-icon>
      Confirmar eliminación
    </h2>

    <mat-dialog-content>
      <p>
        ¿Desea eliminar la institución
        <strong>{{ data.nombre }}</strong>?
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()" class="app-button-secondary">
        Cancelar
      </button>

      <button mat-flat-button color="warn" (click)="aceptar()">
        Eliminar
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogMensajeInstitucionComponent {
  private dialogRef = inject(MatDialogRef<DialogMensajeInstitucionComponent>);
  data = inject(MAT_DIALOG_DATA);

  aceptar() {
    this.dialogRef.close(true);
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
