import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModulosService, Modulo } from '../../../../app/core/services/modulos.service';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../../core/services/login.service';
import { EscuelaService } from '../../../core/services/escuela.service';

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
  ubicacionNombre: string = '';
  ubicacionLogo: string = '';

  constructor(
    private modulosService: ModulosService,
    private loginService: LoginService,
    public router: Router,
    private escuelaService: EscuelaService
  ) { }

  ngOnInit(): void {

    this.usuarioActual = this.loginService.getUser();

    console.log('Usuario actual:', this.usuarioActual);

    if (!this.usuarioActual) {
      console.error('No hay usuario logueado');
      return;
    }

    const usuarioId = this.usuarioActual.data.id;
    const rolId = this.usuarioActual.data.rolId;

    if (!rolId) {
      console.error('El usuario no tiene rol asignado');
      return;
    }

    // Cargar escuela asignada al usuario
    this.escuelaService.getEscuelaPorUsuario(usuarioId).subscribe({
      next: (res: any) => {
        const escuela = res?.data ?? res;

        if (escuela?.id) {
          this.ubicacionNombre = escuela.nombre;
          this.ubicacionLogo = escuela.imagenUrl
            ? `http://localhost:7000${escuela.imagenUrl}`
            : '';
          localStorage.setItem('escuelaId', String(escuela.id));
          localStorage.setItem('escuelaNombre', escuela.nombre);
        } else {
          this.ubicacionNombre = 'Sin escuela asignada';
          this.ubicacionLogo = '';
          localStorage.removeItem('escuelaId');
        }
      },
      error: () => {
        this.ubicacionNombre = 'Sin escuela asignada';
        this.ubicacionLogo = '';
        localStorage.removeItem('escuelaId');
      }
    });

    this.cargarModulosPorRol(rolId);
  }

  cargarModulosPorRol(rolId: number) {

    this.modulosService.getSubModulosByRol(rolId).subscribe({
      next: (res: any) => {

        console.log('Datos recibidos del backend:', res);

        if (res && res.success && Array.isArray(res.data?.modulos)) {

          this.modulos = res.data.modulos
            .map((mod: any) => ({
              id: mod.id,
              nombre: mod.nombre,
              ruta: mod.ruta,
              icon: mod.icon || 'fas fa-folder',
              estado: mod.estado,
              subModulos: mod.subModulos || []
            }))
            .sort((a: any, b: any) => {
              if (a.nombre === 'Dashboard') return -1;
              if (b.nombre === 'Dashboard') return 1;
                if (a.nombre === 'Gestion institucional') return -1;
  if (b.nombre === 'Gestion   ') return 1;

              return 0;
            });

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

  onClickModulo(mod: any) {

    if (mod.ruta && mod.ruta.trim() !== '') {
      this.router.navigateByUrl(mod.ruta);
    }

    if (mod.subModulos && mod.subModulos.length > 0) {
      this.toggle(mod.id);
    }
  }

  logout() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
