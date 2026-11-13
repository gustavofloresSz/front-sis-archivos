import { Component, inject, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
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
    ProfileComponent,
    MatButtonModule,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  private authService = inject(AuthService);

  isOpen = false;
  readonly esMovil = signal(false);
  fullname = this.authService.fullname;
  rol = this.authService.rol;

  constructor() {
    inject(BreakpointObserver).observe('(max-width: 767px)')
      .pipe(takeUntilDestroyed()).subscribe(({ matches }) => this.esMovil.set(matches));
  }

  puede(recurso: string, accion: string): boolean {
    return this.authService.tienePermiso(recurso, accion);
  }
}
