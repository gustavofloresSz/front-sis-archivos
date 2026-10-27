# Sistema de Gestión de Trámites Urbanos - Frontend

Aplicación web desarrollada con Angular para registrar, consultar y dar seguimiento administrativo y físico a trámites urbanos. El frontend consume la API del proyecto `back_tramites` y aplica control de acceso mediante recursos y acciones asociados al usuario autenticado.

El proyecto fue generado con Angular CLI 19.0.4.

## Funcionalidades principales

- Autenticación y cambio de contraseña.
- Administración de usuarios, roles y permisos.
- Registro, edición, consulta y actualización de trámites.
- Gestión y previsualización de documentos asociados.
- Aplicación de sellos a documentos PDF.
- Seguimiento del flujo administrativo y su representación gráfica.
- Asignación y seguimiento de ubicaciones y movimientos físicos.
- Administración de catálogos, instituciones, ambientes y estantes.
- Generación y consulta de reportes individuales.

## Organización de `src/app`

```text
src/app/
├── auth/                         # Autenticación, sesión, guards y perfil
├── interceptors/                 # Inclusión del token en solicitudes HTTP
├── components/
│   ├── pages/
│   │   ├── main/                 # Layout principal y navegación lateral
│   │   ├── usuarios/             # Administración de funcionarios
│   │   ├── roles/                # Administración de roles y permisos
│   │   └── gestion-tramites/
│   │       ├── catalogos/        # Tipos y clasificaciones de trámite
│   │       ├── organizacion/     # Instituciones
│   │       ├── control-fisico/   # Ambientes, estantes y movimientos físicos
│   │       ├── tramites/         # Registro, detalle, workflow y reportes
│   │       └── shared/           # Presentación compartida entre los subdominios
│   └── services/                 # Servicios HTTP agrupados por dominio
├── app.config.ts                 # Proveedores globales de Angular
└── app.routes.ts                 # Rutas y permisos requeridos por vista
```

## Código compartido de gestión de trámites

La carpeta `gestion-tramites/shared` concentra únicamente funciones reutilizadas por más de un subdominio:

- `archivos/archivo-adjunto.config.ts`: formatos permitidos, límite e identificación de archivos.
- `archivos/archivo-presentacion.ts`: nombre, extensión visible y descarga de blobs.
- `archivos/visor-archivo/`: presentación reutilizable de documentos PDF.
- `presentacion/fecha-presentacion.ts`: formatos de fecha usados en vistas e historiales.
- `presentacion/ubicacion-fisica-presentacion.ts`: construcción uniforme de descripciones físicas.

Las reglas específicas permanecen en el dominio correspondiente:

- `tramites/shared`: estados e historial administrativo.
- `tramites/registro-edicion/shared`: selección de elementos de catálogos durante el formulario.
- `control-fisico/shared`: presentación de estados y movimientos físicos.

Esta separación evita repetir lógica sin trasladar llamadas HTTP, validaciones de permisos o reglas operativas fuera de sus componentes.

## Ejecución local

Instalar dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm start
```

La aplicación estará disponible normalmente en `http://localhost:4200/`.

## Compilación

Para verificar tipos y plantillas:

```bash
npm run build
```

Los archivos generados se almacenan en `dist/`. El proyecto mantiene presupuestos de tamaño configurados en Angular; si el bundle supera esos límites, la compilación de producción finalizará con una advertencia o error de presupuesto aunque el código sea válido.

## Generación de componentes

```bash
ng generate component ruta/nombre-componente
```

Los componentes nuevos deben ubicarse dentro del dominio al que pertenecen. Solo deben colocarse en `shared` cuando exista reutilización real en dos o más componentes.
