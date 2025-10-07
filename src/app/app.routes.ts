import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboaraadComponent } from './features/auth/dashboaraad/dashboaraad.component';
import { ArticulosComponent } from './features/articulos/articulos.component';
import { TipoArticulosService } from './core/services/tipo-articulos.service';
import { TiposArticulosComponent } from './features/tipos-articulos/tipos-articulos.component';
import { PisosComponent } from './features/pisos/pages/pisos-list/pisos-list.component';
import { TipoUbicacionComponent } from './features/tipo-ubicacion/tipo-ubicacion.component';
import { UbicacionComponent } from './features/ubicacion/ubicacion.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboaraadComponent },
  { path: 'articulos', component: TiposArticulosComponent },
  { path: 'articulos/tipo/:id', component: ArticulosComponent },
  
  {path: 'pisos' , component:PisosComponent},
  { path: 'tipo-ubicacion', component: TipoUbicacionComponent },
  { path: 'ubicaciones', component: UbicacionComponent},
  { path: '**', redirectTo: 'login' },
];
