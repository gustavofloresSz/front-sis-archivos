import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-visor-archivo',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './visor-archivo.component.html',
  styles: `
    .visor-control {
      flex-shrink: 0;
      --mdc-icon-button-icon-color: #fff;
    }

    .visor-control mat-icon {
      color: #fff;
    }

    .visor-control:disabled mat-icon {
      opacity: 0.45;
    }
  `,
})
export class VisorArchivoComponent implements OnChanges {
  @Input({ required: true }) url!: SafeResourceUrl;
  @Input() nombre = 'Documento PDF';
  @Input() altura = '70vh';
  @Output() cerrar = new EventEmitter<void>();

  readonly zoomMinimo = 50;
  readonly zoomMaximo = 200;
  zoom = 100;
  readonly Math = Math;

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['url']) this.zoom = 100;
  }

  ajustarZoom(paso: number): void {
    this.zoom = Math.max(this.zoomMinimo, Math.min(this.zoomMaximo, this.zoom + paso));
  }
}
