import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dialog-mensaje-tipo-tramite',
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
        ¿Desea eliminar el tipo de trámite
        <strong>{{ data.nombre }}</strong>?
      </p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()">
        Cancelar
      </button>

      <button mat-flat-button color="warn" (click)="aceptar()">
        Eliminar
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogMensajeTipoTramiteComponent {
  private dialogRef = inject(MatDialogRef<DialogMensajeTipoTramiteComponent>);
  data = inject(MAT_DIALOG_DATA);

  aceptar() {
    this.dialogRef.close(true);
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
