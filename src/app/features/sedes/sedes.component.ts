import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SedeService } from '../../core/services/sede.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sedes',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './sedes.component.html',
  styleUrls: ['./sedes.component.css']
})
export class SedesComponent implements OnInit {

  menuAbierto = false;

  filtro: string = '';

  sedes: any[] = [];
  sedesFiltradas: any[] = [];

  mostrarFormulario = false;
  editando = false;

  paginaActual: number = 1;
  registrosPorPagina: number = 6;

  menuAbiertoId: number | null = null;

  nuevaSede = {
    id: 0,
    nombre: '',
    direccion: '',
    estado: true
  };

  constructor(private sedeService: SedeService) { }

  ngOnInit(): void {
    this.cargarSedes();
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

  cargarSedes() {
    this.sedeService.getSedes().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;
        this.sedes = Array.isArray(data) ? data : [];
        this.aplicarFiltro();
      },
      error: () => {
        this.sedes = [];
        this.sedesFiltradas = [];
      }
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();

    this.sedesFiltradas = texto
      ? this.sedes.filter(s =>
          s.nombre?.toLowerCase().includes(texto) ||
          s.direccion?.toLowerCase().includes(texto)
        )
      : [...this.sedes];

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.sedesFiltradas.length / this.registrosPorPagina) || 1;
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.sedesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevaSede = { id: 0, nombre: '', direccion: '', estado: true };
      this.editando = false;
    }
  }
guardarSede() {

  if (!this.nuevaSede.nombre.trim() || !this.nuevaSede.direccion.trim()) {

    let camposFaltantes = [];

    if (!this.nuevaSede.nombre.trim()) {
      camposFaltantes.push('Nombre');
    }

    if (!this.nuevaSede.direccion.trim()) {
      camposFaltantes.push('Dirección');
    }

    Swal.fire({
      icon: 'warning',
      title: 'Faltan datos',
      text: `Complete los siguientes campos: ${camposFaltantes.join(', ')}`
    });

    return;
  }

  const req = this.editando
    ? this.sedeService.updateSede(this.nuevaSede.id, this.nuevaSede)
    : this.sedeService.addSede(this.nuevaSede);

  req.subscribe({
    next: () => {
      this.toggleFormulario();
Swal.fire({
  icon: 'success',
  title: this.editando ? '¡Sede editada!' : '¡Sede registrada!',
  text: this.editando
    ? 'Los cambios se guardaron correctamente en la sede.'
    : 'La sede fue registrada exitosamente en el sistema.',
  confirmButtonText: 'Entendido'
});    this.cargarSedes();
    },
    error: (err) => {
      const msg =
        typeof err?.error === 'string'
          ? err.error
          : err?.error?.message || err?.error?.errors || 'No se pudo guardar la sede';

      Swal.fire('Error', msg, 'error');
    }
  });
}

  editarSede(s: any) {
    this.nuevaSede = { ...s };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarSede(id: number) {
    Swal.fire({
      title: '¿Eliminar sede?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.sedeService.deleteSede(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'La sede ha sido eliminada', 'success');
            this.cargarSedes();
          },
          error: (err) => {
            const msg =
              typeof err?.error === 'string'
                ? err.error
                : err?.error?.message || err?.error?.errors || 'No se pudo eliminar la sede';

            Swal.fire('Error', msg, 'error');
          }
        });
      }
    });
  }
}
