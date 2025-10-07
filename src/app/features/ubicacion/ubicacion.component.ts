import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { TipoUbicacionService } from '../../core/services/tipo-ubicacion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ubicaciones',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './ubicacion.component.html',
  styleUrls: ['./ubicacion.component.css']
})
export class UbicacionComponent {
  filtro: string = '';
  ubicaciones: any[] = [];
  tiposUbicacion: any[] = [];
  ubicacionesFiltradas: any[] = [];
  mostrarFormulario = false;
  editando = false;

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 12;

  nuevaUbicacion = {
    id: 0,
    nombre: '',
    descripcion: '',
    tipoUbicacionId: 0
  };

  constructor(
    private ubicacionService: UbicacionService,
    private tipoUbicacionService: TipoUbicacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUbicaciones();
    this.cargarTiposUbicacion();
  }

  cargarUbicaciones() {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (data: any[]) => {
        this.ubicaciones = data;
        this.aplicarFiltro();
      },
      error: (err: any) => {
        console.error("Error al obtener ubicaciones", err);
      }
    });
  }

  cargarTiposUbicacion() {
    this.tipoUbicacionService.getTipoUbicaciones().subscribe({
      next: (data: any[]) => {
        this.tiposUbicacion = data;
      },
      error: (err: any) => {
        console.error("Error al obtener tipos de ubicación", err);
      }
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.ubicacionesFiltradas = texto
      ? this.ubicaciones.filter(u => u.nombre.toLowerCase().includes(texto))
      : this.ubicaciones;
    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.ubicacionesFiltradas.length / this.registrosPorPagina);
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.ubicacionesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevaUbicacion = { id: 0, nombre: '', descripcion: '', tipoUbicacionId: 0 };
      this.editando = false;
    }
  }

  guardarUbicacion() {
    if (this.editando) {
      this.ubicacionService.updateUbicacion(this.nuevaUbicacion.id, this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Actualizado!', 'Ubicación actualizada correctamente.', 'success');
        },
        error: (err: any) => {
          console.error("Error al actualizar ubicación", err);
          Swal.fire('Error', 'No se pudo actualizar la ubicación.', 'error');
        }
      });
    } else {
      this.ubicacionService.addUbicacion(this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Ubicación agregada correctamente.', 'success');
        },
        error: (err: any) => {
          console.error("Error al guardar ubicación", err);
          Swal.fire('Error', 'Ya existe una ubicación con ese nombre y el mismo tipo.', 'error');
        }
      });
    }
  }

  editarUbicacion(ubicacion: any) {
    this.nuevaUbicacion = { ...ubicacion };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarUbicacion(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubicacionService.deleteUbicacion(id).subscribe({
          next: () => {
            this.ubicaciones = this.ubicaciones.filter(u => u.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'La ubicación ha sido eliminada.', 'success');
          },
          error: (err: any) => {
            console.error("Error al eliminar ubicación", err);
            Swal.fire('Error', 'No se pudo eliminar la ubicación.', 'error');
          }
        });
      }
    });
  }
}
