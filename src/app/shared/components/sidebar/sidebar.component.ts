import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModulosService, Modulo } from '../../../../app/core/services/modulos.service';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../../core/services/login.service';
import { EscuelaService } from '../../../core/services/escuela.service';
import { RolesService } from '../../../core/services/roles.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
  esSuperAdmin = false;

  constructor(
    private modulosService: ModulosService,
    private loginService: LoginService,
    public router: Router,
    private escuelaService: EscuelaService,
    private rolesService: RolesService
  ) { }

  ngOnInit(): void {
    this.usuarioActual = this.loginService.getUser();

    if (!this.usuarioActual) return;

    const usuarioId = this.usuarioActual.data.id;
    const rolId = this.usuarioActual.data.rolId;

    if (!rolId) return;

    // Carga rol y escuela en paralelo
    forkJoin({
      rol: this.rolesService.getRolById(rolId).pipe(catchError(() => of(null))),
      escuela: this.escuelaService.getEscuelaPorUsuario(usuarioId).pipe(catchError(() => of(null)))
    }).subscribe(({ rol, escuela }: any) => {
      const nombreRol = (
        rol?.data?.rol?.nombre ?? rol?.data?.nombre ?? ''
      ).toLowerCase().trim();

      this.esSuperAdmin = nombreRol === 'superadmin';

      if (this.esSuperAdmin) {
        this.ubicacionNombre = 'Oficina de Tecnologías de la Información';
        this.ubicacionLogo = '';
        localStorage.removeItem('escuelaId');
        localStorage.removeItem('escuelaNombre');
      } else {
        const escuelaData = escuela?.data ?? escuela;
        if (escuelaData?.id) {
          this.ubicacionNombre = escuelaData.nombre;
          this.ubicacionLogo = escuelaData.imagenUrl
            ? `http://localhost:7000${escuelaData.imagenUrl}`
            : '';
          localStorage.setItem('escuelaId', String(escuelaData.id));
          localStorage.setItem('escuelaNombre', escuelaData.nombre);
        } else {
          this.ubicacionNombre = 'Sin asignar';
          this.ubicacionLogo = '';
          localStorage.removeItem('escuelaId');
          localStorage.removeItem('escuelaNombre');
        }
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
