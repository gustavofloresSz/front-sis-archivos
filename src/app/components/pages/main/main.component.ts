import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ProfileComponent } from '../../../auth/pages/profile/profile.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { AuthService } from '../../../auth/services/auth.service';


@Component({
  selector: 'app-main',
  imports: [
    RouterModule,
    MatIcon,
    MatSidenavModule,
    OverlayModule,
    ProfileComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  private authService = inject(AuthService);

  isOpen = false;
  fullname = this.authService.fullname;
  rol = this.authService.rol;

  puede(recurso: string, accion: string): boolean {
    return this.authService.tienePermiso(recurso, accion);
  }
}
