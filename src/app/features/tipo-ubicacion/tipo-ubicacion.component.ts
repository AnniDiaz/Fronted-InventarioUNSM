import { Component, OnInit } from '@angular/core';
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
export class TipoUbicacionComponent implements OnInit {

  filtro: string = '';
  ubicaciones: any[] = [];
  ubicacionesFiltradas: any[] = [];
  mostrarFormulario = false;
  editando = false;
  menuAbierto: boolean = false;

  // Se agregó 'descripcion' para coincidir con la UI
  nuevaUbicacion = {
    id: 0,
    nombre: '',
    descripcion: ''
  };

  paginaActual: number = 1;
  registrosPorPagina: number = 6;

  constructor(
    private ubicacionService: TipoUbicacionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarUbicaciones();
  }
  toggleMenu() { this.menuAbierto = !this.menuAbierto; }

  verUbicaciones(tipoId: number) {
    this.router.navigate(['/ubicaciones'], { queryParams: { tipo: tipoId } });
  }

  cargarUbicaciones() {
    this.ubicacionService.getTipoUbicaciones().subscribe({
      next: (data: any[]) => {
        this.ubicaciones = data;
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Error al obtener ubicaciones', err);
      }
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.ubicacionesFiltradas = texto
      ? this.ubicaciones.filter(u =>
        u.nombre.toLowerCase().includes(texto)
      )
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
      this.nuevaUbicacion = { id: 0, nombre: '', descripcion: '' };
      this.editando = false;
    }
  }

  guardarUbicacion() {
    if (this.editando) {
      this.ubicacionService.updateTipoUbicacion(this.nuevaUbicacion.id, this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Actualizado!', 'Tipo de ubicación actualizada correctamente.', 'success');
        },
        error: (err) => {
          console.error('Error al actualizar tipo de ubicación', err);
          Swal.fire('Error', 'No se pudo actualizar el tipo de ubicación.', 'error');
        }
      });
    } else {
      // Crear nuevo
      this.ubicacionService.addTipoUbicacion(this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Tipo de ubicación agregada correctamente.', 'success');
        },
        error: (err) => {
          console.error('Error al guardar tipo de ubicación', err);
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
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubicacionService.deleteTipoUbicacion(id).subscribe({
          next: () => {
            this.ubicaciones = this.ubicaciones.filter(u => u.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'El tipo de ubicación ha sido eliminado.', 'success');
          },
          error: (err) => {
            console.error('Error al eliminar tipo de ubicación', err);
            Swal.fire('Error', 'No se pudo eliminar el tipo de ubicación porque tiene registros relacionados.', 'error');
          }
        });
      }
    });
  }

  verUbicacion(ubicacion: any) {
    Swal.fire({
      title: 'Detalle de Ubicación',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>ID:</strong> ${ubicacion.id}</p>
          <p><strong>Nombre:</strong> ${ubicacion.nombre}</p>
          <p><strong>Descripción:</strong> ${ubicacion.descripcion || 'No especificada'}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#3b82f6'
    });
  }
}