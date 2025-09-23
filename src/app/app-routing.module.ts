import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PisosListComponent } from './features/pisos/pages/pisos-list/pisos-list.component';

const routes: Routes = [
  { path: '', redirectTo: '/pisos', pathMatch: 'full' },
  { path: 'pisos', component: PisosListComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
