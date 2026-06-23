import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { TipoUbicacionService } from '../../core/services/tipo-ubicacion.service';
import Swal from 'sweetalert2';
import { LoginService } from '../../core/services/login.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { EscuelaService } from '../../core/services/escuela.service';

@Component({
  selector: 'app-ubicaciones',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.css']
})
export class UbicacionComponent implements OnInit {

  menuAbierto = false;

  filtro: string = '';
  filtroTipo: number | string = 'todos';
  ubicaciones: any[] = [];
  tiposUbicacion: any[] = [];
  ubicacionesFiltradas: any[] = [];
  escuelas: any[] = [];

  idFacultades: number | null = null;
usuarioActual: any = null;
ubicacionUsuario: any = null;
ubicacionesPadre: any[] = [];

  mostrarFormulario = false;
  editando = false;
facultadUsuario: any = null;
  paginaActual: number = 1;
  registrosPorPagina: number = 6;
mostrarModalUsuario = false;
ubicacionSeleccionada: any = null;
usuarioSeleccionadoId: number = 0;
usuarios: any[] = [];
  menuAbiertoId: number | null = null;
rolId: number = 0;
  nuevaUbicacion = {
    id: 0,
    nombre: '',
    descripcion: '',
    piso: 0,
    tipoUbicacionId: 0,
    usuarioId: null as number | null,
    escuelaId: null as number | null
  };

  constructor(
  private ubicacionService: UbicacionService,
  private tipoUbicacionService: TipoUbicacionService,
  private router: Router,
  private route: ActivatedRoute,
  private loginService: LoginService,
  private usuariosService: UsuariosService,
  private escuelaService: EscuelaService
  ) { }

ngOnInit(): void {

  this.rolId = Number(localStorage.getItem('rolId')); // 🔥 PRIMERO

  this.usuarioActual =
    this.loginService.getUser() ||
    JSON.parse(localStorage.getItem('user') || 'null');

  if (!this.usuarioActual) return;

  const usuarioId = this.usuarioActual.data.id;

  this.cargarEscuelas();

  if (this.esAdministrador()) {

    this.cargarTodasLasUbicaciones();
    this.cargarTiposUbicacion();
    this.cargarUsuarios();

    return;
  }


  this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (res: any) => {

      if (Array.isArray(res) && res.length > 0) {

        this.facultadUsuario = res[0];
        this.ubicacionesPadre = [this.facultadUsuario];

        this.cargarSubUbicaciones(this.facultadUsuario.id);

      } else {

        this.facultadUsuario = null;
        this.ubicacionesPadre = [];
        this.ubicaciones = [];
        this.ubicacionesFiltradas = [];

      }

      this.cargarTiposUbicacion();
      this.cargarUsuarios();
    },
    error: () => {

      this.facultadUsuario = null;
      this.ubicacionesPadre = [];
      this.ubicaciones = [];
      this.ubicacionesFiltradas = [];

    }
  });

}
 esAdministrador(): boolean {
  const rolId = Number(localStorage.getItem('rolId'));
  return rolId === 1;
}

recargarUbicaciones(): void {
  if (this.esAdministrador()) {
    this.cargarTodasLasUbicaciones();
  } else if (this.facultadUsuario?.id) {
    this.cargarSubUbicaciones(this.facultadUsuario.id);
  }
}
cargarTodasLasUbicaciones() {

  this.ubicacionService.getUbicaciones().subscribe({
    next: (res: any) => {

      const data = res?.data ?? res;
      const lista = Array.isArray(data) ? data : [];

      this.ubicaciones = lista;

      this.aplicarFiltro();
    }
  });

}
cargarEscuelas() {
  this.escuelaService.getEscuelas().subscribe({
    next: (res: any) => {
      const data = res?.data ?? res;
      this.escuelas = Array.isArray(data) ? data : [];
    },
    error: () => {
      this.escuelas = [];
    }
  });
}
cargarUsuarios() {
  this.usuariosService.getUsuarios().subscribe({
    next: (resp: any) => {

      if (resp?.success && Array.isArray(resp.data)) {
        this.usuarios = resp.data;
      } else {
        this.usuarios = [];
      }

    },
    error: () => {
      this.usuarios = [];
    }
  });
}
cargarSubUbicaciones(padreId: number) {
  this.ubicacionService.getUbicacionesPorPadre(padreId).subscribe({
    next: (res: any) => {
      const data = res?.data ?? res;
      let listaHijos = Array.isArray(data) ? data : [];

      // ✨ INYECCIÓN GLOBAL: Si la ubicación general "Otros" no está en la lista, la agregamos manualmente al inicio
      const existeOtros = listaHijos.some((u: any) => u.id === 100);

      if (!existeOtros) {
        listaHijos.unshift({
          id: 100,
          nombre: 'Otros',
          descripcion: 'Ubicación por defecto para artículos sin ubicación especificada',
          piso: 0,
          tipoUbicacionId: 100, // ID de tu TipoUbicacion General
          usuarioId: null,
          padreId: null
        });
      }

      // Asignamos la lista combinada al listado del componente
      this.ubicaciones = listaHijos;

      this.aplicarFiltro();
    }
  });
}

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-options')) {
      this.menuAbiertoId = null;
    }
  }

  toggleOpciones(id: number, event: Event) {
    event.stopPropagation();
    this.menuAbiertoId = this.menuAbiertoId === id ? null : id;
  }

cargarTiposUbicacion(): Promise<void> {
  return new Promise((resolve) => {
    this.tipoUbicacionService.getTipoUbicaciones().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        const tipos = Array.isArray(data) ? data : [];

        this.tiposUbicacion = tipos;

        resolve();
      }
    });
  });
}

  obtenerTipo(id: number): string {
    return this.tiposUbicacion.find(t => t.id === id)?.nombre || 'Sin tipo';
  }

  // =========================
  // FILTROS
  // =========================
  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();

    let docs = [...this.ubicaciones];

    if (texto) {
      docs = docs.filter(u =>
        u.nombre.toLowerCase().includes(texto) ||
        (u.descripcion && u.descripcion.toLowerCase().includes(texto))
      );
    }

    if (this.filtroTipo !== 'todos') {
      const tId = Number(this.filtroTipo);
      docs = docs.filter(u => u.tipoUbicacionId === tId);
    }

    this.ubicacionesFiltradas = docs;
    this.paginaActual = 1;
  }

  // =========================
  // PAGINACIÓN
  // =========================
  get totalPaginas(): number {
    return Math.ceil(this.ubicacionesFiltradas.length / this.registrosPorPagina) || 1;
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.ubicacionesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  // =========================
  // FORMULARIO
  // =========================
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevaUbicacion = {
        id: 0,
        nombre: '',
        descripcion: '',
        piso: 0,
        tipoUbicacionId: 0,
        usuarioId: null,
        escuelaId: null
      };
      this.editando = false;
    }
  }
  guardarUbicacion() {


  if (
    !this.nuevaUbicacion.nombre.trim() ||
    !this.nuevaUbicacion.descripcion.trim() ||
    this.nuevaUbicacion.tipoUbicacionId === 0 ||
    this.nuevaUbicacion.piso <= 0
  ) {
    Swal.fire({
      title: 'Campos incompletos',
      text: 'Debe completar todos los campos obligatorios para continuar.',
      icon: 'warning',
      confirmButtonText: 'Entendido'
    });
    return;
  }

    const payload = {
      id: this.nuevaUbicacion.id,
      nombre: this.nuevaUbicacion.nombre,
      descripcion: this.nuevaUbicacion.descripcion || '',
      piso: this.nuevaUbicacion.piso,
      tipoUbicacionId: this.nuevaUbicacion.tipoUbicacionId,
      usuarioId: this.nuevaUbicacion.usuarioId || this.usuarioActual?.data?.id || 0,
      escuelaId: this.nuevaUbicacion.escuelaId || 0
    };

    const req = this.editando
      ? this.ubicacionService.updateUbicacion(this.nuevaUbicacion.id, payload)
      : this.ubicacionService.addUbicacion(payload);

    req.subscribe({
      next: () => {

  this.toggleFormulario();

Swal.fire(
  'Registro exitoso',
  'La ubicación fue registrada correctamente en el sistema.',
  'success'
);
this.recargarUbicaciones();

      },
      error: () => {
        Swal.fire('Error', 'No se pudo guardar', 'error');
      }
    });
  }

editarUbicacion(u: any) {

  this.nuevaUbicacion = { ...u };

  this.editando = true;
  this.mostrarFormulario = true;
}
asignarUsuario(u: any) {
  this.ubicacionSeleccionada = u;
  this.usuarioSeleccionadoId = u.usuarioId ?? 0;
  this.mostrarModalUsuario = true;
}
cerrarModalUsuario() {
  this.mostrarModalUsuario = false;
  this.ubicacionSeleccionada = null;
  this.usuarioSeleccionadoId = 0;
}
guardarAsignacionUsuario() {

  if (!this.usuarioSeleccionadoId) {
    Swal.fire('Error', 'Seleccione un usuario', 'warning');
    return;
  }

  this.ubicacionService
    .asignarUsuario(this.ubicacionSeleccionada.id, this.usuarioSeleccionadoId)
    .subscribe({
      next: () => {

        Swal.fire('OK', 'Usuario asignado correctamente', 'success');

        this.cerrarModalUsuario();

        // 🔥 refrescar SIN F5
this.recargarUbicaciones();      },
      error: () => {
        Swal.fire('Error', 'No se pudo asignar usuario', 'error');
      }
    });
}
eliminarUbicacion(id: number) {
  Swal.fire({
  title: '¿Está seguro?',
  text: 'La ubicación seleccionada será eliminada permanentemente.',
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sí, eliminar',
  cancelButtonText: 'Cancelar',
  confirmButtonColor: '#d33'
}).then(r => {
    if (r.isConfirmed) {

      this.ubicacionService.deleteUbicacion(id).subscribe(() => {

        Swal.fire('Eliminado', 'Se eliminó correctamente', 'success');

      this.recargarUbicaciones();

      });

    }
  });
}
irAArticulos(id: number) {

  if (this.esAdministrador()) {
    Swal.fire(
      'Acceso denegado',
      'Los administradores no pueden acceder a los artículos.',
      'warning'
    );
    return;
  }

  this.router.navigate(['/articulos'], {
    queryParams: { ubicacion: id }
  });
}
}
