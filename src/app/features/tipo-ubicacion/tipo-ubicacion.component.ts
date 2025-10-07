import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TipoUbicacionService } from '../../core/services/tipo-ubicacion.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tipos-ubicacion',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './tipo-ubicacion.component.html',
  styleUrls: ['./tipo-ubicacion.component.css']
})
export class TipoUbicacionComponent {
  filtro: string = '';
  ubicaciones: any[] = [];
  ubicacionesFiltradas: any[] = [];
  mostrarFormulario = false;
  editando = false;

  nuevaUbicacion = {
    id: 0,
    nombre: ''
  };

  paginaActual: number = 1;
  registrosPorPagina: number = 5;

  constructor(
    private ubicacionService: TipoUbicacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUbicaciones();
  }

  cargarUbicaciones() {
    this.ubicacionService.getTipoUbicaciones().subscribe({
      next: (data: any[]) => {
        this.ubicaciones = data;
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error("Error al obtener ubicaciones", err);
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
    const fin = inicio + this.registrosPorPagina;
    return this.ubicacionesFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevaUbicacion = { id: 0, nombre: '' };
      this.editando = false;
    }
  }

  guardarUbicacion() {
    if (this.editando) {
      // Actualizar
      this.ubicacionService.updateTipoUbicacion(this.nuevaUbicacion.id, this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Actualizado!', 'Tipo de ubicación actualizada correctamente.', 'success');
        },
        error: (err) => {
          console.error("Error al actualizar tipo de ubicación", err);
          Swal.fire('Error', 'No se pudo actualizar el tipo de ubicación.', 'error');
        }
      });
    } else {
      // Agregar nuevo
      this.ubicacionService.addTipoUbicacion(this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Tipo de ubicación agregada correctamente.', 'success');
        },
        error: (err) => {
          console.error("Error al guardar tipo de ubicación", err);
          Swal.fire('Error', 'No se puede guardar, ya existe un registro con ese nombre.', 'error');
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
        this.ubicacionService.deleteTipoUbicacion(id).subscribe({
          next: () => {
            this.ubicaciones = this.ubicaciones.filter(u => u.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'El tipo de ubicación ha sido eliminada.', 'success');
          },
          error: (err) => {
            console.error("Error al eliminar tipo de ubicación", err);
            Swal.fire('Error', 'No se pudo eliminar el tipo de ubicación, porque tiene registros relacionados.', 'error');
          }
        });
      }
    });
  }
}
