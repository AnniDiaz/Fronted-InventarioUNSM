# Inventario UNSM - Frontend

La aplicación `Fronted-InventarioUNSM` es el frontend de un sistema de gestión de inventarios institucionales, construido con Angular 19. Su objetivo es administrar usuarios, roles, permisos, inventario de artículos, ubicaciones, reportes y operaciones como préstamos y traslados.

## 📌 Descripción general

Este proyecto implementa la interfaz de usuario de un sistema de inventario que se integra con un backend REST. Cuenta con autenticación, control de acceso, gestión de módulos y una experiencia administrativa para supervisores y superadministradores.

## 🧩 Funcionalidades principales

- Inicio de sesión seguro con token JWT.
- Panel de control (dashboard) con estadísticas e información relevante.
- Gestión de artículos y tipos de artículos.
- Gestión de ubicaciones y tipos de ubicación.
- Gestión de usuarios, roles y permisos.
- Administración de módulos funcionales del sistema.
- Registro y seguimiento de préstamos de inventario.
- Traslados entre ubicaciones.
- Reportes de inventario y actividades.
- Mantenimiento y seguridad del sistema.
- Perfil de usuario con actualización de información e imagen.

## 🗂️ Estructura de módulos y rutas principales

Las rutas definidas en `src/app/app.routes.ts` incluyen:

- `/login` — Pantalla de autenticación.
- `/dashboard` — Panel principal de control.
- `/tipos-articulos` — Gestión de tipos de artículos.
- `/tipos-articulos/:id` — Formulario para editar o ver tipo de artículo.
- `/tipo-ubicacion` — Gestión de tipos de ubicación.
- `/ubicaciones` — Gestión de ubicaciones físicas.
- `/reportes` — Pantalla de reportes.
- `/traslados` — Gestión de traslados de inventario.
- `/roles` — Gestión de roles.
- `/permisos` — Gestión de permisos.
- `/usuarios` — Gestión de usuarios.
- `/modulos` — Gestión de módulos del sistema.
- `/articulos` — Formulario y listado de artículos.
- `/tipos-articulos/articulo/:id` — Detalles de un artículo específico.
- `/perfil` — Perfil del usuario.
- `/prestamos` — Gestión de préstamos.
- `/mantenimiento` — Mantenimiento del sistema.
- `/seguridad` — Módulo de seguridad.
- `/gestion-institucional` — Panel de superadministración.

## ⚙️ Arquitectura y servicios clave

El frontend está organizado en carpetas de `core`, `features`, `shared` y `superadmin`.

### Servicios principales

Los servicios se encuentran en `src/app/core/services` e incluyen:

- `AuthService` — Registro y generación de tokens.
- `LoginService` — Manejo de sesión, token, usuario actual y llamadas al backend.
- `ArticulosService` — Gestión de artículos del inventario.
- `TipoArticulosService` — Operaciones sobre tipos de artículo.
- `TipoUbicacionService` — Gestión de tipos de ubicación.
- `UbicacionService` — Gestión de ubicaciones.
- `UsuariosService` — Operaciones sobre usuarios.
- `RolesService` — Gestión de roles.
- `PermisosService` — Gestión de permisos.
- `ModulosService` — Gestión de módulos del sistema.
- `PrestamosService` — Gestión de préstamos.
- `TrasladosService` — Gestión de traslados.
- `ReportesService` — Generación de reportes.
- `MantenimientoService` — Soporte de mantenimiento.
- `DashboardService` — Datos del panel principal.
- `CategoriasService`, `CamposArticuloService`, `FacultadesService`, `ArticuloCampoValorService` — servicios auxiliares para categorías, campos dinámicos, facultades y relaciones de artículos.

### Interceptor HTTP

El archivo `src/app/core/interceptors/auth-interceptor.ts` agrega automáticamente el token JWT a cada petición HTTP cuando el usuario está autenticado.

### Configuración de HTTP y rutas

`src/app/app.config.ts` registra:

- `provideRouter(routes)` — Navegación del frontend.
- `provideHttpClient(withInterceptors([authInterceptor]))` — Cliente HTTP con interceptor.

### Base del backend

La URL base para las peticiones al API se define en `src/app/shared/components/helper.ts`:

```ts
let baseUrl = 'http://192.168.50.108:8081/api'
export default baseUrl;
```

## 🧪 Tecnologías usadas

- Angular 19
- Angular CDK y Angular Material
- Bootstrap 5
- FontAwesome
- Chart.js
- SweetAlert2
- ngx-pagination
- html2canvas
- jspdf
- qrious (para QR codes)
- xlsx
- jQuery (usado por select2)

## 🚀 Configuración local

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar la aplicación en desarrollo:

```bash
npm start
```

3. Abrir en el navegador:

```text
http://192.168.50.108:4202
```

## 📦 Comandos útiles

- `npm start` — Ejecuta la app en modo desarrollo.
- `npm run build` — Compila la app para producción.
- `npm test` — Ejecuta tests unitarios con Karma.

## 🧭 Flujo de autenticación

1. El usuario accede a `/login`.
2. Se envía credenciales a `Auth/login`.
3. Si el login es válido, se almacena el token en `localStorage`.
4. El interceptor añade `Authorization: Bearer <token>` en las peticiones.
5. Se pueden consultar y actualizar datos de usuario vía `LoginService`.

## 🗃️ Organización del frontend

- `src/app/features` — Todos los componentes de pantalla agrupados por funcionalidad.
- `src/app/core` — Servicios, guardas, interceptores y lógica compartida.
- `src/app/shared` — Recursos compartidos como helpers y componentes reutilizables.
- `src/app/superadmin` — Pantalla de administración institucional.

## 💡 Notas adicionales

- El proyecto es una aplicación SPA (Single Page Application) con routing basado en Angular Router.
- El backend debe estar disponible en `http://192.168.50.108:8081/api` para que el frontend funcione correctamente.
- Se recomienda revisar las rutas del backend y las entidades correspondientes para completar la integración de cada módulo.

---

Con esta documentación tienes una vista general completa del sistema, sus rutas, servicios y cómo ponerlo en marcha. Puedes ampliar cada sección con detalles del backend cuando el API esté disponible.
