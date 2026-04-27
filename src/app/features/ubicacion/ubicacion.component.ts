import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
export class UbicacionComponent implements OnInit {

  // NUEVO: Estado para el menú responsivo
  menuAbierto = false;

  filtro: string = '';
  filtroTipo: number | string = 'todos';

  ubicaciones: any[] = [];
  tiposUbicacion: any[] = [];
  ubicacionesFiltradas: any[] = [];

  mostrarFormulario = false;
  editando = false;

  paginaActual: number = 1;
  registrosPorPagina: number = 6;

  // UI States
  menuAbiertoId: number | null = null;

  nuevaUbicacion = {
    id: 0,
    nombre: '',
    descripcion: '',
    tipoUbicacionId: 0
  };

  constructor(
    private ubicacionService: UbicacionService,
    private tipoUbicacionService: TipoUbicacionService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.cargarTiposUbicacion();
    this.cargarUbicaciones();
  }

  // ---------------------------
  // TOGGLE MENÚ RESPONSIVO
  // ---------------------------
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // Close the popup menu if user clicks outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.card-options')) {
      this.menuAbiertoId = null;
    }
  }

  toggleOpciones(id: number, event: Event) {
    event.stopPropagation();
    if (this.menuAbiertoId === id) {
      this.menuAbiertoId = null;
    } else {
      this.menuAbiertoId = id;
    }
  }

cargarTiposUbicacion() {
  this.tipoUbicacionService.getTipoUbicaciones().subscribe({
    next: (res: any) => {
      const data = res?.data ?? res;
      this.tiposUbicacion = Array.isArray(data) ? data : [];
    },
    error: (err: any) => console.error("Error tipos", err)
  });
}
cargarUbicaciones() {
  this.ubicacionService.getUbicaciones().subscribe({
    next: (res: any) => {

      console.log("RESPUESTA:", res);

      const data = res?.data;

      this.ubicaciones = Array.isArray(data) ? data : [];

      this.aplicarFiltro();
    },
    error: (err: any) => console.error("Error al obtener ubicaciones", err)
  });
}
  obtenerTipo(id: number): string {
    return this.tiposUbicacion.find(t => t.id === id)?.nombre || 'Sin tipo';
  }

 aplicarFiltro() {
  const texto = this.filtro.trim().toLowerCase();

  let docs = Array.isArray(this.ubicaciones)
    ? [...this.ubicaciones]
    : [];

    // Filtro por texto
    if (texto) {
      docs = docs.filter(u => u.nombre.toLowerCase().includes(texto) || (u.descripcion && u.descripcion.toLowerCase().includes(texto)));
    }

    // Filtro por tipo
    if (this.filtroTipo !== 'todos') {
      const tId = Number(this.filtroTipo);
      docs = docs.filter(u => u.tipoUbicacionId === tId);
    }

    this.ubicacionesFiltradas = docs;
    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.ubicacionesFiltradas.length / this.registrosPorPagina) || 1;
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
        error: (err: any) => Swal.fire('Error', 'No se pudo actualizar la ubicación.', 'error')
      });
    } else {
      this.ubicacionService.addUbicacion(this.nuevaUbicacion).subscribe({
        next: () => {
          this.cargarUbicaciones();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Ubicación agregada correctamente.', 'success');
        },
        error: (err: any) => Swal.fire('Error', 'Ya existe una ubicación con ese nombre y el mismo tipo.', 'error')
      });
    }
  }

  editarUbicacion(ubicacion: any) {
    this.menuAbiertoId = null; // close menu
    this.nuevaUbicacion = { ...ubicacion };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarUbicacion(id: number) {
    this.menuAbiertoId = null; // close menu
    Swal.fire({
      title: '¿Eliminar ubicación?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ubicacionService.deleteUbicacion(id).subscribe({
          next: () => {
            this.cargarUbicaciones();
            Swal.fire('¡Eliminado!', 'La ubicación ha sido eliminada.', 'success');
          },
          error: (err: any) => Swal.fire('Error', 'No se pudo eliminar la ubicación.', 'error')
        });
      }
    });
  }

  irAArticulos(ubicacionId: number) {
    this.router.navigate(['/articulos'], { queryParams: { ubicacion: ubicacionId } });
    // Assuming /articulos can take an 'ubicacion' queryParam
  }
}
