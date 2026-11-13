import { Component, inject } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { Apariencia, AparienciaService } from '../../../../../components/services/preferencias/apariencia.service';

@Component({
  selector: 'app-apariencia',
  imports: [MatRadioModule],
  templateUrl: './apariencia.component.html',
  styleUrl: './apariencia.component.scss',
})
export class AparienciaComponent {
  readonly apariencia = inject(AparienciaService);
  mensaje = '';

  seleccionar(valor: Apariencia): void {
    this.mensaje = this.apariencia.seleccionar(valor)
      ? 'Apariencia actualizada.'
      : 'Apariencia aplicada temporalmente.';
  }
}
