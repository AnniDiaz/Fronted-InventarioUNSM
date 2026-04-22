import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/auth/dashboaraad/dashboaraad.component';
import { TipoUbicacionComponent } from './features/tipo-ubicacion/tipo-ubicacion.component';
import { UbicacionComponent } from './features/ubicacion/ubicacion.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { TrasladosComponent } from './features/traslados/traslados.component';
import { TipoArticulosComponent } from './features/Modulo-Articulos/tipos-articulos/tipos-articulos.component';
import { RolesComponent } from './features/roles/roles.component';
import { PermisosComponent } from './features/permisos/permisos.component';
import { UsuariosComponent } from './features/usuarios/usuarios.component';
import { ModulosComponent } from './features/modulos/modulos.component';
import { ArticuloFormComponent } from './features/Modulo-Articulos/articulos/articulos.component';
import { ArticuloTipoArticuloComponent } from './features/Modulo-Articulos/articulo-tipo-articulo/articulo-tipo-articulo.component';
import { DetallesArticuloComponent } from './features/Modulo-Articulos/detalles-articulo/detalles-articulo.component';
import { PerfilComponent } from './features/perfil/perfil.component';
import { PrestamoComponent } from './features/prestamos/prestamos.component';
import { MantenimientoComponent } from './features/mantenimiento/mantenimiento.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'tipos-articulos', component: TipoArticulosComponent },
  { path: 'tipos-articulos/:id', component: ArticuloTipoArticuloComponent },

  { path: 'tipo-ubicacion', component: TipoUbicacionComponent },
  { path: 'ubicaciones', component: UbicacionComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: 'traslados', component: TrasladosComponent },
  { path: 'roles', component: RolesComponent },
  { path: 'permisos', component: PermisosComponent },
  { path: 'usuarios', component: UsuariosComponent },
  { path: 'modulos', component: ModulosComponent },
  { path: 'articulos', component: ArticuloFormComponent },
  { path: 'perfil', component: PerfilComponent },

  { path: 'tipos-articulos/articulo/:id', component: DetallesArticuloComponent },
  { path: 'prestamos', component: PrestamoComponent },
  { path: 'mantenimiento', component: MantenimientoComponent },

  { path: '**', redirectTo: 'login' },
];
