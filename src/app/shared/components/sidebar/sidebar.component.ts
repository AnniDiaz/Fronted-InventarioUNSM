import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModulosService, Modulo } from '../../../../app/core/services/modulos.service';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../../core/services/login.service';
import { EscuelaService } from '../../../core/services/escuela.service';
import { RolesService } from '../../../core/services/roles.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
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
    private rolesService: RolesService,
    private ubicacionService: UbicacionService
  ) { }

  ngOnInit(): void {
    this.usuarioActual = this.loginService.getUser();

    if (!this.usuarioActual) return;

    const usuarioId = this.usuarioActual.data.id;
    const rolId = this.usuarioActual.data.rolId;

    if (!rolId) return;

    // Carga rol, escuela y ubicación asignada en paralelo.
    // Nota: se consulta siempre getEscuelaPorUsuario (administrador) aquí, incluso para
    // el rol Técnico. Un técnico nunca es el "usuarioId" (administrador) de una escuela,
    // así que esta llamada le devuelve vacío y el código cae a la rama de "ubicación fija
    // asignada directamente" (ubicacionUsuario), que es el mecanismo del que dependen
    // articulos/prestamos/traslados/mantenimiento/etc. para filtrar por técnico. No cambiar
    // esto a getEscuelaPorTecnico sin auditar esos componentes: activar el filtrado por
    // escuela para técnicos rompe esas pantallas si su ubicación fija no pertenece a la
    // escuela que tienen asignada como técnico.
    forkJoin({
      rol: this.rolesService.getRolById(rolId).pipe(catchError(() => of(null))),
      escuela: this.escuelaService.getEscuelaPorUsuario(usuarioId).pipe(catchError(() => of(null))),
      ubicacionUsuario: this.ubicacionService.getUbicacionesPorUsuario(usuarioId).pipe(catchError(() => of(null)))
    }).subscribe(({ rol, escuela, ubicacionUsuario }: any) => {
      const nombreRol = this.normalizarTexto(rol?.data?.rol?.nombre ?? rol?.data?.nombre ?? '');

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
            ? `http://192.168.50.108:8081${escuelaData.imagenUrl}`
            : '';
          localStorage.setItem('escuelaId', String(escuelaData.id));
          localStorage.setItem('escuelaNombre', escuelaData.nombre);
        } else {
          localStorage.removeItem('escuelaId');
          localStorage.removeItem('escuelaNombre');

          const ubicaciones = Array.isArray(ubicacionUsuario) ? ubicacionUsuario : ubicacionUsuario?.data ?? [];
          if (ubicaciones.length > 0) {
            this.ubicacionNombre = ubicaciones[0].nombre;
            this.ubicacionLogo = '';
            localStorage.setItem('ubicacionUsuarioId', String(ubicaciones[0].id));
          } else {
            this.ubicacionNombre = 'Sin asignar';
            this.ubicacionLogo = '';
            localStorage.removeItem('ubicacionUsuarioId');
          }
        }
      }
    });

    this.cargarModulosPorRol(rolId);
  }

  private normalizarTexto(valor: string): string {
    return (valor || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '');
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
              const prioridad = (nombre: string) => {
                if (nombre === 'Dashboard') return 0;
                if (nombre === 'Gestion institucional') return 1;
                if (nombre === 'Reportes') return 3;
                return 2;
              };
              return prioridad(a.nombre) - prioridad(b.nombre);
            });

          // El guard de rutas (moduleGuard) lee esta clave para bloquear el acceso
          // directo por URL a módulos que no están en el menú de este rol.
          localStorage.setItem('modulos', JSON.stringify(this.modulos));

        } else {
          console.warn('Estructura de datos no reconocida:', res);
          this.modulos = [];
          localStorage.setItem('modulos', JSON.stringify([]));
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
