import { inject } from '@angular/core';
import {
  Router,
  type CanActivateChildFn,
  type Data,
} from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export interface PermisoRuta {
  recurso: string;
  accion: string;
}

const ULTIMA_RUTA_AUTORIZADA = 'ultimaRutaAutorizada';

function obtenerPermiso(data: Data): PermisoRuta | null {
  const permiso = data['permiso'] as PermisoRuta | undefined;
  return permiso?.recurso && permiso?.accion ? permiso : null;
}

export const permissionGuard: CanActivateChildFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const permiso = obtenerPermiso(route.data);

  return authService.checkAuthStatus().pipe(
    map((autenticado) => {
      if (!autenticado) {
        return router.parseUrl('/login');
      }

      if (!permiso || authService.tienePermiso(permiso.recurso, permiso.accion)) {
        sessionStorage.setItem(ULTIMA_RUTA_AUTORIZADA, state.url);
        return true;
      }

      const ultimaRuta = sessionStorage.getItem(ULTIMA_RUTA_AUTORIZADA);
      if (ultimaRuta && ultimaRuta !== state.url) {
        return router.parseUrl(ultimaRuta);
      }

      return router.parseUrl('/main');
    }),
  );
};
