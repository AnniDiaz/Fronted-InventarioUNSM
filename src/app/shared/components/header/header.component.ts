import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../../core/services/login.service';
import { Router } from '@angular/router';
import { RolesService } from '../../../core/services/roles.service';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { NotificacionesService, NotificacionDto } from '../../../core/services/notificaciones.service';
import Swal from 'sweetalert2';

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
export class HeaderComponent implements OnInit, OnDestroy {

  usuarioActual: any
  rolActual: any;
  pageTitle = 'Panel de Control';

  notificaciones: NotificacionDto[] = [];
  countNoLeidas = 0;
  panelNotificacionesAbierto = false;
  cargandoNotificaciones = false;

  private readonly POLL_INTERVAL_MS = 45000;
  private pollingHandle: any;

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
    private cdr: ChangeDetectorRef,
    private rolService: RolesService,
    private sidebarState: SidebarStateService,
    private notificacionesService: NotificacionesService,
    private elementRef: ElementRef
  ) { }

  toggleSidebar() {
    this.sidebarState.toggle();
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  irAConfiguracion() {
    this.router.navigate(['/seguridad']);
  }

  mostrarAyuda() {
    Swal.fire({
      icon: 'info',
      title: 'Centro de Ayuda',
      html: `
        <div style="text-align:left; font-size:14px;">
          <p><strong>Artículos:</strong> registra, edita y da de baja los activos del inventario.</p>
          <p><strong>Ubicaciones:</strong> gestiona las aulas, laboratorios y espacios donde se asignan los artículos.</p>
          <p><strong>Préstamos / Traslados:</strong> genera solicitudes de uso o movimiento de equipos entre ubicaciones.</p>
          <p><strong>Mantenimiento:</strong> programa y da seguimiento a los mantenimientos preventivos/correctivos.</p>
          <p style="margin-top:12px;">Si tienes un problema puntual, contacta a la Oficina de Tecnologías de la Información.</p>
        </div>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#00a468'
    });
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

  this.cargarContadorNotificaciones();
  this.pollingHandle = setInterval(() => this.cargarContadorNotificaciones(), this.POLL_INTERVAL_MS);
}

ngOnDestroy(): void {
  if (this.pollingHandle) {
    clearInterval(this.pollingHandle);
  }
}

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  if (!this.panelNotificacionesAbierto) return;
  if (!this.elementRef.nativeElement.contains(event.target)) {
    this.panelNotificacionesAbierto = false;
  }
}

toggleNotificaciones(event: MouseEvent): void {
  event.stopPropagation();
  this.panelNotificacionesAbierto = !this.panelNotificacionesAbierto;

  if (this.panelNotificacionesAbierto) {
    this.cargarNotificaciones();
    this.cargarContadorNotificaciones();
  }
}

cargarContadorNotificaciones(): void {
  this.notificacionesService.getCountNoLeidas().subscribe({
    next: (resp) => {
      this.countNoLeidas = resp.data ?? 0;
    },
    error: (err) => {
      this.countNoLeidas = 0;
      if (err.status !== 401) {
        console.error('Error al cargar contador de notificaciones', err);
      }
    }
  });
}

cargarNotificaciones(): void {
  this.cargandoNotificaciones = true;
  this.notificacionesService.getNotificaciones().subscribe({
    next: (resp) => {
      this.notificaciones = resp.data ?? [];
      this.cargandoNotificaciones = false;
    },
    error: (err) => {
      this.notificaciones = [];
      this.cargandoNotificaciones = false;
      if (err.status !== 401) {
        console.error('Error al cargar notificaciones', err);
      }
    }
  });
}

marcarTodasComoLeidas(event: MouseEvent): void {
  event.stopPropagation();
  this.notificacionesService.marcarTodasLeidas().subscribe({
    next: () => {
      this.cargarNotificaciones();
      this.cargarContadorNotificaciones();
    },
    error: (err) => console.error('Error al marcar todas como leídas', err)
  });
}

irANotificacion(notificacion: NotificacionDto): void {
  if (!notificacion.leido) {
    this.notificacionesService.marcarLeida(notificacion.id).subscribe({
      next: () => {
        notificacion.leido = true;
        this.countNoLeidas = Math.max(0, this.countNoLeidas - 1);
      },
      error: (err) => console.error('Error al marcar notificación como leída', err)
    });
  }

  this.panelNotificacionesAbierto = false;

  if (notificacion.articuloId) {
    this.router.navigate(['/tipos-articulos/articulo', notificacion.articuloId]);
  } else if (notificacion.prestamoId) {
    this.router.navigate(['/prestamos']);
  }
}

tiempoRelativo(fechaIso: string): string {
  const fecha = new Date(fechaIso).getTime();
  const ahora = Date.now();
  const segundos = Math.max(0, Math.floor((ahora - fecha) / 1000));

  if (segundos < 60) return 'hace un momento';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} d`;

  const meses = Math.floor(dias / 30);
  return `hace ${meses} mes${meses > 1 ? 'es' : ''}`;
}
}
