import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboaraadComponent } from './features/auth/dashboaraad/dashboaraad.component';
import { ArticulosComponent } from './features/articulos/articulos.component';
import { TipoArticulosService } from './core/services/tipo-articulos.service';
import { TiposArticulosComponent } from './features/tipos-articulos/tipos-articulos.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboaraadComponent },
  { path: 'articulos', component: TiposArticulosComponent },
  { path: 'articulos/tipo/:id', component: ArticulosComponent },
  { path: '**', redirectTo: 'login' }
];
