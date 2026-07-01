import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../../core/services/login.service';
import { Router } from '@angular/router';
import { RolesService } from '../../../core/services/roles.service';

// Define una interfaz para tu usuario
interface Usuario {
  id: number;
  username: string;
  nombre?: string;
  email?: string;
  imagenPath?: string;
  rolId?: any;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  usuarioActual: any
  rolActual: any;
  pageTitle = 'Panel de Control';

  private rutasTitulos: { match: RegExp; titulo: string }[] = [
    { match: /^\/dashboard/, titulo: 'Panel de Control (Dashboard)' },
    { match: /^\/tipos-articulos\/articulo\/\d+/, titulo: 'Detalle de Artículo' },
    { match: /^\/tipos-articulos\/\d+/, titulo: 'Campos del Tipo de Artículo' },
    { match: /^\/tipos-articulos/, titulo: 'Tipos de Artículos' },
    { match: /^\/tipo-ubicacion/, titulo: 'Tipos de Ubicación' },
    { match: /^\/ubicaciones/, titulo: 'Ubicaciones' },
    { match: /^\/sedes/, titulo: 'Gestion de Sedes' },
    { match: /^\/facultades/, titulo: 'Gestion de Facultades' },
    { match: /^\/escuelas/, titulo: 'Gestion de Escuelas' },
    { match: /^\/reportes/, titulo: 'Reportes' },
    { match: /^\/traslados/, titulo: 'Traslados' },
    { match: /^\/roles/, titulo: 'Roles' },
    { match: /^\/permisos/, titulo: 'Permisos' },
    { match: /^\/usuarios/, titulo: 'Usuarios' },
    { match: /^\/modulos/, titulo: 'Módulos' },
    { match: /^\/articulos/, titulo: 'Artículos' },
    { match: /^\/perfil/, titulo: 'Mi Perfil' },
    { match: /^\/seguridad/, titulo: 'Seguridad' },
    { match: /^\/prestamos\/generar-documento/, titulo: 'Generar Préstamo' },
    { match: /^\/prestamos/, titulo: 'Préstamos' },
    { match: /^\/mantenimiento/, titulo: 'Mantenimiento' },
    { match: /^\/gestion-institucional/, titulo: 'Panel de Control (Dashboard)' },
    { match: /^\/consulta-bienes/, titulo: 'Inventario y Consultas de Bienes' },
    { match: /^\/solicitantes/, titulo: 'Solicitantes' }
  ];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef, // <--- Importante
    private rolService: RolesService
  ) { }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  irAConfiguracion() {
    this.router.navigate(['/seguridad']);
  }

  private obtenerTitulo(url: string): string {
    const encontrado = this.rutasTitulos.find(r => r.match.test(url));
    return encontrado?.titulo || 'Panel de Control';
  }

ngOnInit(): void {

  this.pageTitle = this.obtenerTitulo(this.router.url.split('?')[0]);

  this.usuarioActual = this.loginService.getUser();
  console.log("USUARIO ACTUAL: ", this.usuarioActual);

  if (!this.usuarioActual?.data) return;

  const rolId = this.usuarioActual.data.rolId;

  // 🔥 CARGAR ROL
  if (rolId) {
    this.rolService.getRolById(rolId).subscribe({
      next: (res: any) => {
        this.rolActual = res.data; // 👈 IMPORTANTE
        console.log("ROL ACTUAL: ", this.rolActual);
      }
    });
  }
}
}
