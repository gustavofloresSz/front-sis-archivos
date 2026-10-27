import { Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

import { MatButtonModule } from '@angular/material/button';
import {MatMenuModule} from '@angular/material/menu';
import {MatListModule} from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatIcon,
    MatListModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  @Output() menuCerrado = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  fullname = this.authService.fullname;
  rol = this.authService.rol;
  
  irConfiguracion(){
    this.menuCerrado.emit();
    this.router.navigate(['/main/configuracion']);
  }
  cerrarSesion(){
    this.menuCerrado.emit();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}


