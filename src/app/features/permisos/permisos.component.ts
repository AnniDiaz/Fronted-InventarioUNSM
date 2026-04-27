import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { PermisoService } from '../../../app/core/services/permisos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-permisos',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './permisos.component.html',
  styleUrls: ['./permisos.component.css']
})
export class PermisosComponent {

  permisos: any[] = [];
  permisosFiltrados: any[] = [];
  filtro: string = '';
  mostrarFormulario: boolean = false;
  editando: boolean = false;

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 12;

  nuevoPermiso = {
    id: 0,
    nombre: '',
    activo: true
  };

  constructor(private permisoService: PermisoService) { }

  ngOnInit(): void {
    this.cargarPermisos();
  }

cargarPermisos() {
  this.permisoService.getPermisos().subscribe({
    next: (resp: any) => {
      console.log("RESPUESTA PERMISOS:", resp);

      // 🔥 VALIDACIÓN
      if (!resp || !resp.success || !Array.isArray(resp.data)) {
        console.warn("Respuesta inválida:", resp);
        this.permisos = [];
        this.permisosFiltrados = [];
        return;
      }

      // ✅ EXTRAER ARRAY REAL
      this.permisos = resp.data;

      console.log("PERMISOS ARRAY:", this.permisos);

      this.aplicarFiltro();
    },
    error: (err: any) => {
      console.error("Error al obtener permisos", err);
      this.permisos = [];
      this.permisosFiltrados = [];
    }
  });
}

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.permisosFiltrados = texto
      ? this.permisos.filter(p => p.nombre.toLowerCase().includes(texto))
      : this.permisos;
    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.permisosFiltrados.length / this.registrosPorPagina);
  }

  get permisosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.permisosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevoPermiso = { id: 0, nombre: '', activo: true };
      this.editando = false;
    }
  }

  guardarPermiso() {
    if (this.editando) {
    this.permisoService.updatePermiso(this.nuevoPermiso.id, this.nuevoPermiso).subscribe({
  next: () => {
    this.cargarPermisos();
    this.toggleFormulario();
    Swal.fire('¡Actualizado!', 'Permiso actualizado correctamente.', 'success');
  },
  error: (err: any) => {
    console.error("Error al actualizar permiso", err);

    const mensaje =
      err?.error?.errors ||
      err?.error?.message ||
      'No se pudo actualizar el permiso.';

    Swal.fire('Error', mensaje, 'error');
  }
});
    } else {
this.permisoService.addPermiso(this.nuevoPermiso).subscribe({
  next: () => {
    this.cargarPermisos();
    this.toggleFormulario();
    Swal.fire('¡Agregado!', 'Permiso agregado correctamente.', 'success');
  },
  error: (err: any) => {
    console.error("Error al agregar permiso", err);

    const mensaje =
      err?.error?.errors ||
      err?.error?.message ||
      'No se pudo agregar el permiso.';

    Swal.fire('Error', mensaje, 'error');
  }
});
    }
  }

  editarPermiso(permiso: any) {
    this.nuevoPermiso = { ...permiso };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarPermiso(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.permisoService.deletePermiso(id).subscribe({
          next: () => {
            this.permisos = this.permisos.filter(p => p.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'El permiso ha sido eliminado.', 'success');
          },
          error: (err: any) => {
            console.error("Error al eliminar permiso", err);
            Swal.fire('Error', 'No se pudo eliminar el permiso.', 'error');
          }
        });
      }
    });
  }

}
