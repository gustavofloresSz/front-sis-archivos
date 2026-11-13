import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TramiteDetalleComponent } from '../../detalle/tramite-detalle/tramite-detalle.component';

@Component({
  selector: 'app-detalle-reporte-tramite',
  imports: [
    CommonModule,
    TramiteDetalleComponent,
  ],
  templateUrl: './detalle-reporte-tramite.component.html',
  styleUrl: './detalle-reporte-tramite.component.scss'
})
export class DetalleReporteTramiteComponent {
  @Input() tramite: any | null = null;
  @Input() mostrarArchivos = true;
  @Input() mostrarUbicacion = true;
  @Input() consultaReporte = false;
}
