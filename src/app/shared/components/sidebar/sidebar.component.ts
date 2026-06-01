import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModulosService, Modulo } from '../../../../app/core/services/modulos.service';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../../core/services/login.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';

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
    public  router: Router,
    private ubicacionService:UbicacionService,
  ) { }

ngOnInit(): void {
  this.usuarioActual = this.loginService.getUser();

  console.log('Usuario actual:', this.usuarioActual);

  // 🚨 validar usuario
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

  // ==============================
  // 🔥 1. CARGAR UBICACIÓN
  // ==============================
  this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
      next: (res: any) => {

    console.log("Ubicaciones del usuario:", res);

    if (Array.isArray(res) && res.length > 0) {
      const ubicacion = res[0];

      this.ubicacionNombre = ubicacion.nombre;

      // 🔥 construir URL completa del backend
      this.ubicacionLogo = ubicacion.imagenUrl
        ? `http://localhost:7000${ubicacion.imagenUrl}`
        : '';
    } else {
      this.ubicacionNombre = 'Sin ubicación asignada';
      this.ubicacionLogo = '';
    }
  },
  error: (err) => {
    console.error(err);
    this.ubicacionNombre = 'Error al cargar ubicación';
    this.ubicacionLogo = '';
  }
});

  this.cargarModulosPorRol(rolId);
}

  cargarModulosPorRol(rolId: number) {

    this.modulosService.getSubModulosByRol(rolId).subscribe({
      next: (res: any) => {
        console.log('Datos recibidos del backend:', res);

        if (res && res.success && res.data && Array.isArray(res.data.modulos)) {

          this.modulos = res.data.modulos.map((mod: any) => ({
            id: mod.id,
            nombre: mod.nombre,
            ruta: mod.ruta,
            icon: mod.icon || 'fas fa-folder',
            estado: mod.estado,
            subModulos: mod.subModulos || []
          }));

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
  // 1. Si tiene ruta → SIEMPRE navega primero
  if (mod.ruta && mod.ruta.trim() !== '') {
this.router.navigateByUrl(mod.ruta);  }

  // 2. Si tiene submódulos → también expande
  if (mod.subModulos && mod.subModulos.length > 0) {
    this.toggle(mod.id);
  }
}
  logout() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
