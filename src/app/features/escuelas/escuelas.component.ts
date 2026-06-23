import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { EscuelaService } from '../../core/services/escuela.service';
import { FacultadService } from '../../core/services/facultad.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-escuelas',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './escuelas.component.html',
  styleUrls: ['./escuelas.component.css']
})
export class EscuelasComponent implements OnInit {

  menuAbierto = false;

  filtro: string = '';

  escuelas: any[] = [];
  escuelasFiltradas: any[] = [];
  facultades: any[] = [];

  mostrarFormulario = false;
  editando = false;

  paginaActual: number = 1;
  registrosPorPagina: number = 6;

  menuAbiertoId: number | null = null;

  imagenFile: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;

  nuevaEscuela = {
    id: 0,
    nombre: '',
    facultadId: 0,
    imagenUrl: ''
  };

  constructor(
    private escuelaService: EscuelaService,
    private facultadService: FacultadService
  ) { }

  ngOnInit(): void {
    this.cargarFacultades();
    this.cargarEscuelas();
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

  cargarFacultades() {
    this.facultadService.getFacultades().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.facultades = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.facultades = [];
      }
    });
  }

  cargarEscuelas() {
    this.escuelaService.getEscuelas().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.escuelas = Array.isArray(data) ? data : [];
        this.aplicarFiltro();
      },
      error: () => {
        this.escuelas = [];
        this.escuelasFiltradas = [];
      }
    });
  }

  obtenerNombreFacultad(facultadId: number): string {
    return this.facultades.find(f => f.id === facultadId)?.nombre || 'Sin facultad';
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();

    this.escuelasFiltradas = texto
      ? this.escuelas.filter(e =>
          e.nombre?.toLowerCase().includes(texto) ||
          this.obtenerNombreFacultad(e.facultadId).toLowerCase().includes(texto)
        )
      : [...this.escuelas];

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.escuelasFiltradas.length / this.registrosPorPagina) || 1;
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.escuelasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.imagenFile = null;
    this.imagenPreview = null;

    if (!this.mostrarFormulario) {
      this.nuevaEscuela = { id: 0, nombre: '', facultadId: 0, imagenUrl: '' };
      this.editando = false;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (file) {
      this.imagenFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.imagenPreview = reader.result;
      };

      reader.readAsDataURL(file);
    }
  }

  guardarEscuela() {
    if (!this.nuevaEscuela.nombre || !this.nuevaEscuela.facultadId) {
      Swal.fire('Faltan datos', 'Nombre y facultad son obligatorios', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.nuevaEscuela.nombre);
    formData.append('facultadId', this.nuevaEscuela.facultadId.toString());

    if (this.imagenFile) {
      formData.append('imagen', this.imagenFile);
    }

    const req = this.editando
      ? this.escuelaService.updateEscuela(this.nuevaEscuela.id, formData)
      : this.escuelaService.addEscuela(formData);

    req.subscribe({
      next: () => {
        this.toggleFormulario();
        Swal.fire('OK', 'Guardado correctamente', 'success');
        this.cargarEscuelas();
      },
      error: (err) => {
        const msg =
          typeof err?.error === 'string'
            ? err.error
            : err?.error?.message || err?.error?.errors || 'No se pudo guardar la escuela';

        Swal.fire('Error', msg, 'error');
      }
    });
  }

  editarEscuela(e: any) {
    this.nuevaEscuela = { ...e };
    this.editando = true;
    this.mostrarFormulario = true;
    this.imagenFile = null;
    this.imagenPreview = e.imagenUrl ? 'http://localhost:7000' + e.imagenUrl : null;
  }

  eliminarEscuela(id: number) {
    Swal.fire({
      title: '¿Eliminar escuela?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.escuelaService.deleteEscuela(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La escuela ha sido eliminada', 'success');
            this.cargarEscuelas();
          },
          error: (err) => {
            const msg =
              typeof err?.error === 'string'
                ? err.error
                : err?.error?.message || err?.error?.errors || 'No se pudo eliminar la escuela';

            Swal.fire('Error', msg, 'error');
          }
        });
      }
    });
  }
}
