import { Routes } from '@angular/router';
import { LoginComponent } from './auth/pages/login/login.component';
import { MainComponent } from './components/pages/main/main.component';
import { isAuthenticatedGuard } from './auth/guards/is-authenticate-guard';
import { permissionGuard } from './auth/guards/permission.guard';
import { TramitesComponent } from './components/pages/gestion-tramites/tramites/tramites.component';
import { UsuariosComponent } from './components/pages/usuarios/usuarios.component';
import { ConsultaTramiteComponent } from './consultas/pages/consulta-tramite/consulta-tramite.component';
import { TipoTramiteComponent } from './components/pages/gestion-tramites/catalogos/tipo-tramite/tipo-tramite.component';
import { InstitucionComponent } from './components/pages/gestion-tramites/organizacion/institucion/institucion.component';
import { ReporteTramitesComponent } from './components/pages/gestion-tramites/tramites/reportes/reporte-tramites/reporte-tramites.component';
import { ReporteMovimientosFisicosComponent } from './components/pages/gestion-tramites/control-fisico/reportes/reporte-movimientos-fisicos/reporte-movimientos-fisicos.component';
import { ConfiguracionComponent } from './auth/pages/profile/configuracion/configuracion.component';
import { ClasificacionTramiteComponent } from './components/pages/gestion-tramites/catalogos/clasificacion-tramite/clasificacion-tramite.component';
import { AmbienteFisicoComponent } from './components/pages/gestion-tramites/control-fisico/ambientes/ambiente-fisico.component';
import { EstanteFisicoComponent } from './components/pages/gestion-tramites/control-fisico/estantes/estante-fisico.component';
import { RolesComponent } from './components/pages/roles/roles.component';
import { ResumenWorkflowTramitesComponent } from './components/pages/gestion-tramites/tramites/reportes/resumen-workflow-tramites/resumen-workflow-tramites.component';

export const routes: Routes = [
    {
        path: 'main',
        component: MainComponent,
        canActivate: [isAuthenticatedGuard],
        canActivateChild: [permissionGuard],
        children: [
            {
                path:'tramites',
                component:TramitesComponent,
                data: { permiso: { recurso: 'tramite', accion: 'ver' } },
            },
            {
                path:'tipo-tramite',
                component:TipoTramiteComponent,
                data: { permiso: { recurso: 'tipo_tramite', accion: 'ver' } },
            },
            {
                path:'clasificacion-tramite',
                component:ClasificacionTramiteComponent,
                data: { permiso: { recurso: 'clasificacion_tramite', accion: 'ver' } },
            },
            {
                path:'ambientes-fisicos',
                component:AmbienteFisicoComponent,
                data: { permiso: { recurso: 'ambiente_fisico', accion: 'ver' } },
            },
            {
                path:'estantes-fisicos',
                component:EstanteFisicoComponent,
                data: { permiso: { recurso: 'estante_fisico', accion: 'ver' } },
            },
            {
                path:'instituciones',
                component:InstitucionComponent,
                data: { permiso: { recurso: 'institucion', accion: 'ver' } },
            },
            {
                path:'usuarios',
                component:UsuariosComponent,
                data: { permiso: { recurso: 'usuario', accion: 'ver' } },
            },
            {
                path:'roles',
                component:RolesComponent,
                data: { permiso: { recurso: 'rol', accion: 'ver' } },
            },
            {
                path:'configuracion',
                component:ConfiguracionComponent
            },
            //reporte workflow estados
            {
                path:'reporte-tramites/resumen-flujo',
                component:ResumenWorkflowTramitesComponent,
                data: { permiso: { recurso: 'tramite', accion: 'ver' } },
            },
            {
                path:'reporte-tramites',
                component:ReporteTramitesComponent,
                data: { permiso: { recurso: 'tramite', accion: 'ver' } },
            },
            //reporte movimientos fisicos
            {
                path:'reporte-movimientos-fisicos',
                component:ReporteMovimientosFisicosComponent,
                data: { permiso: { recurso: 'movimiento_fisico', accion: 'ver' } },
            }
        ]
    },
    {
        path:'consulta-tramites',component:ConsultaTramiteComponent
    },

    {
        path:'login',component:LoginComponent
    },
    {
        path: '', redirectTo: 'login', pathMatch: 'full'
    },
];
