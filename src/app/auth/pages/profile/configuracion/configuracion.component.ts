import { Component } from '@angular/core';
import { CambiarPasswordComponent } from './cambiar-password/cambiar-password.component';
import { MatTabsModule } from '@angular/material/tabs';
import { AparienciaComponent } from './apariencia/apariencia.component';

@Component({
  selector: 'app-configuracion',
  imports: [CambiarPasswordComponent, MatTabsModule, AparienciaComponent],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent {}
