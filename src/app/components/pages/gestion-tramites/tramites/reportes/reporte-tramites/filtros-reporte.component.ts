import { Component, inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { CriterioReporte } from '../../../../../services/gestion-tramites/tramites/reportes.service';

export const FILTROS_REPORTE: {
  criterio: CriterioReporte; etiqueta: string; descripcion: string; placeholder: string; icono: string;
}[] = [
  { criterio: 'todos', etiqueta: 'Todos los campos', descripcion: 'Buscar en los trámites de todas las instituciones',
    placeholder: 'Código de trámite o archivo, solicitante, institución o gestión', icono: 'search' },
  { criterio: 'solicitante', etiqueta: 'Nombre del solicitante', descripcion: 'Buscar por nombres o apellidos en todas las instituciones',
    placeholder: 'Ej.: Raúl u Orellana', icono: 'person' },
  { criterio: 'institucion', etiqueta: 'Institución', descripcion: 'Buscar por el nombre o la sigla de la institución',
    placeholder: 'Ej.: CTR, Central, D3 o D4', icono: 'account_balance' },
];

@Component({
  selector: 'app-filtros-reporte',
  imports: [MatListModule, MatIconModule],
  template: `
    <section class="py-3" aria-labelledby="titulo-filtros-reporte">
      <h2 id="titulo-filtros-reporte" class="m-0 px-4 text-lg font-semibold">Buscar por</h2>
      <mat-nav-list aria-label="Filtros del reporte">
        @for (filtro of filtros; track filtro.criterio) {
          <button mat-list-item type="button" (click)="seleccionar(filtro.criterio)"
            [attr.aria-current]="seleccionado === filtro.criterio ? 'true' : null">
            <mat-icon matListItemIcon>{{ filtro.icono }}</mat-icon>
            <span matListItemTitle>{{ filtro.etiqueta }}</span>
            <span matListItemLine>{{ filtro.descripcion }}</span>
            @if (seleccionado === filtro.criterio) { <mat-icon matListItemMeta>check</mat-icon> }
          </button>
        }
      </mat-nav-list>
    </section>
  `,
})
export class FiltrosReporteComponent {
  readonly filtros = FILTROS_REPORTE;
  readonly seleccionado = inject<CriterioReporte>(MAT_BOTTOM_SHEET_DATA);
  private readonly panel = inject<MatBottomSheetRef<FiltrosReporteComponent, CriterioReporte>>(MatBottomSheetRef);

  seleccionar(criterio: CriterioReporte): void {
    this.panel.dismiss(criterio);
  }
}
