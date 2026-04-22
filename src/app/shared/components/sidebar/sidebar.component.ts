import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModulosService, Modulo } from '../../../../app/core/services/modulos.service';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../../core/services/login.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  modulos: Modulo[] = [];
  expanded: Record<number, boolean> = {};
  usuarioActual: any = null;

  constructor(
    private modulosService: ModulosService,
    private loginService: LoginService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.usuarioActual = this.loginService.getUser();
    console.log('Usuario actual:', this.usuarioActual);

    if (!this.usuarioActual) {
      console.error('No hay usuario logueado');
      return;
    }

    if (!this.usuarioActual.data.rolId) {
      console.error('El usuario no tiene rol asignado');
      return;
    }

    console.log('Cargando módulos para rolId:', this.usuarioActual.data.rolId);
    this.cargarModulosPorRol(this.usuarioActual.data.rolId);
  }

  cargarModulosPorRol(rolId: number) {
    console.log("Iniciando carga de módulos para el rol:", rolId);

    this.modulosService.getSubModulosByRol(rolId).subscribe({
      next: (res: any) => {
        console.log('Datos recibidos del backend:', res);

        // 1. Validamos que res.data exista y que res.data.modulos sea el array
        if (res && res.success && res.data && Array.isArray(res.data.modulos)) {

          // 2. Mapeamos desde res.data.modulos
          this.modulos = res.data.modulos.map((mod: any) => ({
            id: mod.id,
            nombre: mod.nombre,
            ruta: mod.ruta,
            icon: mod.icon || 'fas fa-folder',
            estado: mod.estado,
            // Aquí ya vienen tus subModulos agrupados (Array de 2 elementos en tu log)
            subModulos: mod.subModulos || []
          }));

          console.log('Módulos mapeados con éxito:', this.modulos);
        } else {
          console.warn('Estructura de datos no reconocida:', res);
          this.modulos = [];
        }
      },
      error: (err) => console.error('Error cargando módulos por rol:', err)
    });
  }

  toggle(id: number) {
    this.expanded[id] = !this.expanded[id];
  }

  logout() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}