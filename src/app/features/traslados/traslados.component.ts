import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import Swal from 'sweetalert2';

// Servicios
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

  // Control de Vista
  mostrarFormulario = false;
  menuAbierto = false;

  // Filtros
  filtroTexto: string = '';
  filtroFecha: string = '';

  // Datos
  traslados: any[] = [];
  listaArticulos: any[] = [];
  listaUbicaciones: any[] = [];

  // Formulario
  nuevoTraslado: any = {
    articulo: '',
    origen: '',
    destino: '',
    observaciones: ''
  };

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 5;

  constructor(
    private trasladoService: TrasladosService,
    private articuloService: ArticuloService,
    private ubicacionService: UbicacionService
  ) { }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargarTraslados();
    this.cargarArticulos();
    this.cargarUbicaciones();
  }

  cargarTraslados(): void {
    this.trasladoService.getTraslados().subscribe({
      next: (data) => this.traslados = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar los traslados', 'error')
    });
  }

  cargarArticulos(): void {
    this.articuloService.getArticulos().subscribe({
      next: (data) => this.listaArticulos = data,
      error: () => console.error('Error cargando artículos')
    });
  }

  cargarUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (data) => this.listaUbicaciones = data,
      error: () => console.error('Error cargando ubicaciones')
    });
  }

  // --- LÓGICA DE FILTROS ---

  get trasladosFiltrados(): any[] {
    return this.traslados.filter(t => {
      const texto = this.filtroTexto.toLowerCase();

      const coincideTexto =
        t.articulo?.nombre?.toLowerCase().includes(texto) ||
        t.ubicacionOrigen?.nombre?.toLowerCase().includes(texto) ||
        t.ubicacionDestino?.nombre?.toLowerCase().includes(texto);

      const coincideFecha = this.filtroFecha
        ? t.fechaTraslado?.includes(this.filtroFecha)
        : true;

      return coincideTexto && coincideFecha;
    });
  }

  aplicarFiltro(): void {
    this.paginaActual = 1;
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  // --- PAGINACIÓN (Sincronizada con el HTML nuevo) ---

  get totalRegistros(): number {
    return this.trasladosFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.registrosPorPagina);
  }

  get registrosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.trasladosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // --- GESTIÓN DE FORMULARIO ---

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.limpiarFormulario();
  }

  onArticuloChange(articuloId: any): void {
    if (!articuloId) return;

    this.articuloService.getArticuloById(articuloId).subscribe({
      next: (art) => this.nuevoTraslado.origen = art.ubicacionId,
      error: () => {
        Swal.fire('Error', 'No se pudo obtener la ubicación del artículo', 'error');
        this.nuevoTraslado.origen = '';
      }
    });
  }

  getNombreUbicacion(id: any): string {
    const ubicacion = this.listaUbicaciones.find(u => u.id == id);
    return ubicacion ? ubicacion.nombre : 'Seleccione un artículo...';
  }

  guardarTraslado(): void {
    if (this.nuevoTraslado.origen === this.nuevoTraslado.destino) {
      Swal.fire('Atención', 'El destino no puede ser igual al origen', 'warning');
      return;
    }

    const payload = {
      articuloId: this.nuevoTraslado.articulo,
      ubicacionOrigenId: this.nuevoTraslado.origen,
      ubicacionDestinoId: this.nuevoTraslado.destino,
      fechaTraslado: new Date().toISOString(),
      observaciones: this.nuevoTraslado.observaciones,
      usuarioId: 1
    };

    this.trasladoService.realizarTraslado(payload).subscribe({
      next: () => {
        Swal.fire('¡Éxito!', 'Traslado registrado correctamente', 'success');
        this.cargarTraslados();
        this.toggleFormulario();
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo registrar', 'error')
    });
  }

  verDetalles(traslado: any): void {
    Swal.fire({
      title: 'Detalles del Traslado',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Artículo:</strong> ${traslado.articulo?.nombre}</p>
          <p><strong>Origen:</strong> ${traslado.ubicacionOrigen?.nombre}</p>
          <p><strong>Destino:</strong> ${traslado.ubicacionDestino?.nombre}</p>
          <p><strong>Fecha:</strong> ${new Date(traslado.fechaTraslado).toLocaleString()}</p>
          <p><strong>Observaciones:</strong> ${traslado.observaciones || 'Sin observaciones'}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#00a468'
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