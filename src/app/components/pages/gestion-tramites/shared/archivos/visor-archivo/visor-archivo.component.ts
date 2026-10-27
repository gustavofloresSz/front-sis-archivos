import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-visor-archivo',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './visor-archivo.component.html',
})
export class VisorArchivoComponent {
  @Input({ required: true }) url!: SafeResourceUrl;
  @Input() nombre = 'Documento PDF';
  @Input() altura = '70vh';
  @Output() cerrar = new EventEmitter<void>();
}
