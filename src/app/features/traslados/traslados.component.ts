import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { TrasladosService } from '../../core/services/traslados.service';
import { ArticuloService } from '../../core/services/articulos.service';
import { UbicacionService } from '../../core/services/ubicacion.service';

@Component({
  selector: 'app-traslados',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './traslados.component.html',
  styleUrls: ['./traslados.component.css']
})
export class TrasladosComponent implements OnInit {

  mostrarFormulario = false;
  filtro = '';

  listaArticulos: any[] = [];
  listaUbicaciones: any[] = [];
  traslados: any[] = [];

  // 🔥 SIN FECHA
  nuevoTraslado: any = {
    articulo: '',
    origen: '',
    destino: '',
    observaciones: ''
  };

  paginaActual = 1;
  registrosPorPagina = 5;

  constructor(
    private trasladoService: TrasladosService,
    private articuloService: ArticuloService,
    private ubicacionService: UbicacionService
  ) {}

  ngOnInit(): void {
    this.cargarTraslados();
    this.cargarArticulos();
    this.cargarUbicaciones();
  }

  cargarTraslados(): void {
    this.trasladoService.getTraslados().subscribe({
      next: data => this.traslados = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar los traslados', 'error')
    });
  }

  cargarArticulos(): void {
    this.articuloService.getArticulos().subscribe({
      next: data => this.listaArticulos = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar los artículos', 'error')
    });
  }

  cargarUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe({
      next: data => this.listaUbicaciones = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar las ubicaciones', 'error')
    });
  }

  onArticuloChange(articuloId: number): void {
    if (!articuloId) {
      this.nuevoTraslado.origen = '';
      return;
    }

    this.articuloService.getArticuloById(articuloId).subscribe({
      next: articulo => this.nuevoTraslado.origen = articulo.ubicacionId,
      error: () => {
        Swal.fire('Error', 'No se pudo obtener la ubicación del artículo', 'error');
        this.nuevoTraslado.origen = '';
      }
    });
  }

  get totalPaginas(): number {
    return Math.ceil(this.filtrarTraslados().length / this.registrosPorPagina);
  }

  get registrosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.filtrarTraslados().slice(inicio, inicio + this.registrosPorPagina);
  }

  filtrarTraslados(): any[] {
    const texto = this.filtro.toLowerCase();
    return this.traslados.filter(t =>
      t.articulo?.nombre?.toLowerCase().includes(texto) ||
      t.ubicacionOrigen?.nombre?.toLowerCase().includes(texto) ||
      t.ubicacionDestino?.nombre?.toLowerCase().includes(texto)
    );
  }

  aplicarFiltro(): void {
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.limpiarFormulario();
  }

  // 🔥 FECHA ACTUAL AUTOMÁTICA
guardarTraslado(): void {
  if (this.nuevoTraslado.origen === this.nuevoTraslado.destino) {
    Swal.fire('Error', 'La ubicación origen y destino no pueden ser iguales', 'warning');
    return;
  }

  const payload = {
    articuloId: this.nuevoTraslado.articulo,
    ubicacionOrigenId: this.nuevoTraslado.origen,
    ubicacionDestinoId: this.nuevoTraslado.destino,
    fechaTraslado: new Date().toISOString(), // ✅ fecha actual automática
    usuarioId: 1,
    observaciones: this.nuevoTraslado.observaciones
  };

  this.trasladoService.realizarTraslado(payload).subscribe({
    next: () => {
      Swal.fire('Éxito', 'Traslado realizado correctamente', 'success');
      this.toggleFormulario();
      this.cargarTraslados();
    },
    error: err => {
      Swal.fire('Error', err.error || 'No se pudo realizar el traslado', 'error');
    }
  });
}

  eliminarTraslado(id: number): void {
    Swal.fire({
      title: '¿Eliminar traslado?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.trasladoService.deleteTraslado(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Traslado eliminado', 'success');
            this.cargarTraslados();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
        });
      }
    });
  }

  limpiarFormulario(): void {
    this.nuevoTraslado = {
      articulo: '',
      origen: '',
      destino: '',
      observaciones: ''
    };
  }
}
