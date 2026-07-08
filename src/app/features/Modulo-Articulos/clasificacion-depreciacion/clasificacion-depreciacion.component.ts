import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ClasificacionDepreciacionService } from '../../../core/services/clasificacion-depreciacion.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clasificacion-depreciacion',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './clasificacion-depreciacion.component.html',
  styleUrls: ['./clasificacion-depreciacion.component.css']
})
export class ClasificacionDepreciacionComponent implements OnInit {

  menuAbierto = false;
  filtro = '';

  clasificaciones: any[] = [];
  clasificacionesFiltradas: any[] = [];
  registrosPaginados: any[] = [];

  paginaActual = 1;
  registrosPorPagina = 6;
  totalPaginas = 1;

  mostrarFormulario = false;
  editando = false;

  nuevaClasificacion: any = this.crearVacia();

  constructor(private clasificacionService: ClasificacionDepreciacionService) { }

  ngOnInit(): void {
    this.cargarClasificaciones();
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  crearVacia() {
    return {
      id: null,
      nombre: '',
      descripcion: '',
      vidaUtilAnios: 0
    };
  }

  cargarClasificaciones() {
    this.clasificacionService.getClasificaciones().subscribe({
      next: (res: any) => {
        this.clasificaciones = Array.isArray(res) ? res : res?.data ?? [];
        this.aplicarFiltro();
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las clasificaciones de depreciación', 'error')
    });
  }

  aplicarFiltro() {
    this.paginaActual = 1;
    let lista = [...this.clasificaciones];

    if (this.filtro && this.filtro.trim() !== '') {
      const termo = this.filtro.toLowerCase().trim();
      lista = lista.filter(c => (c.nombre || '').toLowerCase().includes(termo));
    }

    this.clasificacionesFiltradas = lista;
    this.totalPaginas = Math.ceil(this.clasificacionesFiltradas.length / this.registrosPorPagina) || 1;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.clasificacionesFiltradas.slice(inicio, fin);
  }

  cambiarPagina(num: number) {
    if (num < 1 || num > this.totalPaginas) return;
    this.paginaActual = num;
    this.actualizarPagina();
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.resetFormulario();
  }

  resetFormulario() {
    this.editando = false;
    this.nuevaClasificacion = this.crearVacia();
  }

  editarClasificacion(c: any) {
    this.editando = true;
    this.nuevaClasificacion = {
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      vidaUtilAnios: c.vidaUtilAnios
    };
    this.mostrarFormulario = true;
  }

  guardarClasificacion() {
    if (!this.nuevaClasificacion.nombre?.trim()) {
      Swal.fire('Advertencia', 'El nombre es obligatorio', 'warning');
      return;
    }

    const payload = {
      nombre: this.nuevaClasificacion.nombre,
      descripcion: this.nuevaClasificacion.descripcion || '',
      vidaUtilAnios: Number(this.nuevaClasificacion.vidaUtilAnios)
    };

    const request = this.editando
      ? this.clasificacionService.updateClasificacion(this.nuevaClasificacion.id, payload)
      : this.clasificacionService.addClasificacion(payload);

    request.subscribe({
      next: () => {
        Swal.fire('Éxito', `Clasificación ${this.editando ? 'actualizada' : 'registrada'} correctamente`, 'success');
        this.toggleFormulario();
        this.cargarClasificaciones();
      },
      error: (err) => {
        Swal.fire('Error', err?.error?.message || 'No se pudo guardar la clasificación', 'error');
      }
    });
  }

  eliminarClasificacion(id: number) {
    Swal.fire({
      title: '¿Eliminar clasificación?',
      text: 'Los artículos que la usen quedarán sin clasificación asignada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00a468',
      confirmButtonText: 'Sí, eliminar'
    }).then(res => {
      if (res.isConfirmed) {
        this.clasificacionService.deleteClasificacion(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La clasificación ha sido borrada', 'success');
            this.cargarClasificaciones();
          },
          error: (err) => Swal.fire('Error', err?.error?.message || 'No se pudo eliminar', 'error')
        });
      }
    });
  }
}
