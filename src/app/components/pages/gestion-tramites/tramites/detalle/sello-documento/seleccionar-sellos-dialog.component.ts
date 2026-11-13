import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { TIPOS_SELLO, TipoSello } from '../../../../../services/gestion-tramites/tramites/sello-documento.service';

@Component({
  selector: 'app-seleccionar-sellos-dialog',
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>Aplicar sello</h2>
    <mat-dialog-content class="contenido-sellos">
      <p class="break-all font-medium">{{ nombreArchivo }}</p>
      <fieldset class="mt-3">
        <legend>¿Qué contiene este PDF?</legend>
        <div class="flex flex-wrap items-center gap-x-3">
          @for (tipo of tipos; track tipo.valor) {
            <mat-checkbox
              [checked]="seleccion.includes(tipo.valor)"
              (change)="marcar(tipo.valor, $event.checked)">
              {{ tipo.etiqueta }}
            </mat-checkbox>
          }
          <mat-checkbox
            [checked]="seleccion.length === tipos.length"
            (change)="marcarAmbos($event.checked)">
            Ambos
          </mat-checkbox>
        </div>
      </fieldset>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="app-button-secondary" type="button">Cancelar</button>
      <button mat-flat-button class="app-button-primary" type="button"
        [disabled]="!seleccion.length" [mat-dialog-close]="seleccion">
        Generar copia legalizada
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .contenido-sellos {
      flex: 0 0 auto;
      max-height: none;
      overflow: visible;
    }
  `,
})
export class SeleccionarSellosDialogComponent {
  readonly nombreArchivo = inject<string>(MAT_DIALOG_DATA);
  readonly tipos = TIPOS_SELLO;
  seleccion: TipoSello[] = [];

  marcar(tipo: TipoSello, marcado: boolean): void {
    this.seleccion = marcado
      ? [...this.seleccion, tipo]
      : this.seleccion.filter(valor => valor !== tipo);
  }

  marcarAmbos(marcado: boolean): void {
    this.seleccion = marcado ? this.tipos.map(tipo => tipo.valor) : [];
  }
}
