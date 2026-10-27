import { Component } from '@angular/core';
import { CambiarPasswordComponent } from './cambiar-password/cambiar-password.component';

@Component({
  selector: 'app-configuracion',
  imports: [CambiarPasswordComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent {}
