import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

export const isAuthenticatedGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.checkAuthStatus().pipe(
    tap((isAuthenticated) => {
      //cuando alguien trate de entrar directamente a la ruta lo llevara al login
      if (!isAuthenticated) router.navigateByUrl('/login');
    })
  );
};