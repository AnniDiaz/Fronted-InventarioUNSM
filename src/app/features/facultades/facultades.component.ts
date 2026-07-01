import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FacultadService } from '../../core/services/facultad.service';
import { SedeService } from '../../core/services/sede.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-facultades',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './facultades.component.html',
  styleUrls: ['./facultades.component.css']
})
export class FacultadesComponent implements OnInit {

  menuAbierto = false;

  filtro: string = '';

  facultades: any[] = [];
  facultadesFiltradas: any[] = [];
  sedes: any[] = [];

  mostrarFormulario = false;
  editando = false;

  paginaActual: number = 1;
  registrosPorPagina: number = 6;

  menuAbiertoId: number | null = null;

  nuevaFacultad = {
    id: 0,
    nombre: '',
    direccion: '',
    estado: true,
    sedeId: 0
  };

  constructor(
    private facultadService: FacultadService,
    private sedeService: SedeService
  ) { }

  ngOnInit(): void {
    this.cargarFacultades();
    this.cargarSedes();
  }

  cargarSedes() {
    this.sedeService.getSedes().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.sedes = Array.isArray(data) ? data : [];
      },
      error: () => {
        this.sedes = [];
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

  cargarFacultades() {
    this.facultadService.getFacultades().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.facultades = Array.isArray(data) ? data : [];
        this.aplicarFiltro();
      },
      error: () => {
        this.facultades = [];
        this.facultadesFiltradas = [];
      }
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();

    this.facultadesFiltradas = texto
      ? this.facultades.filter(f =>
          f.nombre?.toLowerCase().includes(texto) ||
          f.direccion?.toLowerCase().includes(texto)
        )
      : [...this.facultades];

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.facultadesFiltradas.length / this.registrosPorPagina) || 1;
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.facultadesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevaFacultad = { id: 0, nombre: '', direccion: '', estado: true, sedeId: 0 };
      this.editando = false;
    }
  }
guardarFacultad() {

  const faltantes: string[] = [];

  if (!this.nuevaFacultad.nombre?.trim()) {
    faltantes.push('Nombre');
  }

  if (!this.nuevaFacultad.direccion?.trim()) {
    faltantes.push('Dirección');
  }

  if (!this.nuevaFacultad.sedeId || this.nuevaFacultad.sedeId === 0) {
    faltantes.push('Sede');
  }

  // ❌ SI HAY CAMPOS VACÍOS → ALERTA
  if (faltantes.length > 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Faltan datos',
      text: `Complete los siguientes campos: ${faltantes.join(', ')}`,
      confirmButtonText: 'Entendido'
    });
    return;
  }

  const req = this.editando
    ? this.facultadService.updateFacultad(this.nuevaFacultad.id, this.nuevaFacultad)
    : this.facultadService.addFacultad(this.nuevaFacultad);

  req.subscribe({
    next: () => {
      this.toggleFormulario();

      Swal.fire({
        icon: 'success',
        title: this.editando ? 'Facultad editada' : 'Facultad registrada',
        text: this.editando
          ? 'Los cambios se guardaron correctamente.'
          : 'La facultad fue registrada exitosamente.',
        confirmButtonText: 'OK'
      });

      this.cargarFacultades();
    },
    error: (err: any) => {
      const msg =
        typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || 'No se pudo guardar la facultad';

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg
      });
    }
  });
}
  editarFacultad(f: any) {
    this.nuevaFacultad = { ...f };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarFacultad(id: number) {
    Swal.fire({
      title: '¿Eliminar facultad?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.facultadService.deleteFacultad(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La facultad ha sido eliminada', 'success');
            this.cargarFacultades();
          },
          error: (err) => {
            const msg =
              typeof err?.error === 'string'
                ? err.error
                : err?.error?.message || err?.error?.errors || 'No se pudo eliminar la facultad';

            Swal.fire('Error', msg, 'error');
          }
        });
      }
    });
  }

}
