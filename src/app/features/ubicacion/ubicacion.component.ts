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

  nuevaUbicacion = {
    id: 0,
    nombre: '',
    descripcion: '',
    piso: 0,
    tipoUbicacionId: 0,
    imagenUrl: '',
    padreId: null as number | null
  };

  constructor(
  private ubicacionService: UbicacionService,
  private tipoUbicacionService: TipoUbicacionService,
  private router: Router,
  private route: ActivatedRoute,
  private loginService: LoginService,
  private usuariosService: UsuariosService
  ) { }
ngOnInit(): void {

  this.usuarioActual = this.loginService.getUser()
    || JSON.parse(localStorage.getItem('user') || 'null');

  if (!this.usuarioActual) return;

  const usuarioId = this.usuarioActual.data.id;

  this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (res: any) => {

      if (Array.isArray(res) && res.length > 0) {

        this.facultadUsuario = res[0];
        this.ubicacionesPadre = [this.facultadUsuario];

        // 🔥 SOLO HIJOS DE SU FACULTAD
        this.cargarSubUbicaciones(this.facultadUsuario.id);

      } else {
        this.facultadUsuario = null;
        this.ubicacionesPadre = [];
        this.ubicaciones = [];
        this.ubicacionesFiltradas = [];
      }

      this.cargarTiposUbicacion();
           // 🔥 FALTABA ESTO
      this.cargarUsuarios();
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
      this.ubicaciones = Array.isArray(data) ? data : [];

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

        // 🔥 EXCLUIR "FACULTADES"
        this.tiposUbicacion = tipos.filter(
          (t: any) => t.nombre?.toLowerCase() !== 'facultades'
        );

        this.idFacultades = tipos.find(
          (t: any) => t.nombre?.toLowerCase() === 'facultades'
        )?.id || null;

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
        imagenUrl: '',
        padreId: null
      };
      this.editando = false;
    }
  }

  guardarUbicacion() {

    if (!this.nuevaUbicacion.nombre) {
      Swal.fire('Error', 'El nombre es obligatorio', 'warning');
      return;
    }

    const formData = new FormData();

    formData.append('nombre', this.nuevaUbicacion.nombre);
    formData.append('descripcion', this.nuevaUbicacion.descripcion || '');
    formData.append('piso', this.nuevaUbicacion.piso.toString());
    formData.append('tipoUbicacionId', this.nuevaUbicacion.tipoUbicacionId.toString());
    formData.append('imagenUrl', this.nuevaUbicacion.imagenUrl || '');

// 🔥 ESTE FALTABA
if (this.nuevaUbicacion.padreId !== null && this.nuevaUbicacion.padreId !== undefined) {
  formData.append('padreId', this.nuevaUbicacion.padreId.toString());
}
    const req = this.editando
      ? this.ubicacionService.updateUbicacionForm(this.nuevaUbicacion.id, formData)
      : this.ubicacionService.addUbicacionForm(formData);

    req.subscribe({
      next: () => {

  this.toggleFormulario();

  Swal.fire('OK', 'Guardado correctamente', 'success');

  // 🔥 RECARGAR DATA SIN REFRESH
  if (this.facultadUsuario?.id) {
    this.cargarSubUbicaciones(this.facultadUsuario.id);
  }

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
        this.cargarSubUbicaciones(this.facultadUsuario.id);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo asignar usuario', 'error');
      }
    });
}
eliminarUbicacion(id: number) {
  Swal.fire({
    title: '¿Eliminar?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí'
  }).then(r => {
    if (r.isConfirmed) {

      this.ubicacionService.deleteUbicacion(id).subscribe(() => {

        Swal.fire('Eliminado', 'Se eliminó correctamente', 'success');

        // 🔥 RECARGAR LISTA SIN F5
        if (this.facultadUsuario?.id) {
          this.cargarSubUbicaciones(this.facultadUsuario.id);
        }

      });

    }
  });
}
  irAArticulos(id: number) {
    this.router.navigate(['/articulos'], {
      queryParams: { ubicacion: id }
    });
  }
}
