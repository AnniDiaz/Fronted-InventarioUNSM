import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ArticuloService } from '../../../core/services/articulos.service';
import { CamposArticuloService } from '../../../core/services/campos-articulo.service';
import { TipoArticuloService } from '../../../core/services/tipo-articulos.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Qrious from 'qrious';

@Component({
  selector: 'app-articulo-form',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.css']
})
export class ArticuloFormComponent implements OnInit {

  // NUEVO: Estado para el menú responsivo
  menuAbierto = false;

  mostrarFormulario = false;
  filtro = '';
  filtroTipo = 'Todos'; // NUEVO: para chips
  orden = 'recientes'; // NUEVO: para select de orden

  paginaActual = 1;
  pageSize = 5;
  totalPaginas = 1;

  articulos: any[] = [];
  articulosFiltrados: any[] = []; // NUEVO: todos los filtrados
  registrosPaginados: any[] = [];

  tipos: any[] = [];
  ubicaciones: any[] = [];
  camposDelTipo: any[] = [];

  articulo: any = this.crearArticuloVacio();
  editando = false;

  constructor(
    private articuloService: ArticuloService,
    private campoService: CamposArticuloService,
    private tipoService: TipoArticuloService,
    private ubicService: UbicacionService
  ) { }

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarUbicaciones();
    this.listarArticulos();
  }

  // ---------------------------
  // TOGGLE MENÚ RESPONSIVO
  // ---------------------------
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  // ---------------------------
  // GENERAR QR DESDE URL
  // ---------------------------
  generarQR(url: string): string {
    if (!url) return '';
    const qr = new Qrious({
      value: url,
      size: 180,
      level: 'H'
    });
    return qr.toDataURL();
  }

  descargarQR(a: any) {
    if (!a.qrCodeBase64) {
      Swal.fire('Error', 'El artículo no tiene QR generado', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = a.qrCodeBase64;
    link.download = `QR_${a.codigoPatrimonial || a.id}.png`;
    link.click();
  }

  // ---------------------------
  // FILTRO, ORDEN Y PAGINACIÓN
  // ---------------------------
  setFiltroTipo(tipo: string) {
    this.filtroTipo = tipo;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    this.paginaActual = 1;
    let filtrados = [...this.articulos];

    if (this.filtro && this.filtro.trim() !== '') {
      const termo = this.filtro.toLowerCase().trim();
      filtrados = filtrados.filter(a =>
        (a.nombre && a.nombre.toLowerCase().includes(termo)) ||
        (a.codigoPatrimonial && a.codigoPatrimonial.toLowerCase().includes(termo)) ||
        (this.obtenerTipoArticulo(a.tipoArticuloId).toLowerCase().includes(termo))
      );
    }

    if (this.filtroTipo !== 'Todos') {
      filtrados = filtrados.filter(a => this.obtenerTipoArticulo(a.tipoArticuloId) === this.filtroTipo);
    }

    if (this.orden === 'recientes') {
      filtrados.sort((a, b) => new Date(b.fechaAdquision).getTime() - new Date(a.fechaAdquision).getTime());
    } else if (this.orden === 'antiguos') {
      filtrados.sort((a, b) => new Date(a.fechaAdquision).getTime() - new Date(b.fechaAdquision).getTime());
    } else if (this.orden === 'nombre_asc') {
      filtrados.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
    } else if (this.orden === 'nombre_desc') {
      filtrados.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    }

    this.articulosFiltrados = filtrados;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.articulosFiltrados.length / this.pageSize);
    if (this.totalPaginas === 0) this.totalPaginas = 1;
    if (this.paginaActual > this.totalPaginas) this.paginaActual = this.totalPaginas;

    const inicio = (this.paginaActual - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    this.registrosPaginados = this.articulosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
    this.actualizarPaginacion();
  }

  listarArticulos() {
    this.articuloService.getArticulosConCampos().subscribe({
      next: (data: any[]) => {
        this.articulos = data.map(a => {
          if (a.id) {
            const urlQR = `http://localhost:4200/tipos-articulos/articulo/${a.id}`;
            a.qrCodeBase64 = this.generarQR(urlQR);
          }
          return a;
        });
        this.aplicarFiltro();
      },
      error: (err) => {
        console.error('Error al listar artículos:', err);
        Swal.fire('Error', 'No se pudieron cargar los artículos', 'error');
      }
    });
  }

  getBadgeClass(condicion: string): string {
    if (!condicion) return 'badge-default';
    const cond = condicion.toLowerCase();
    if (cond.includes('nuevo')) return 'badge-nuevo';
    if (cond.includes('usado')) return 'badge-usado';
    if (cond.includes('dañado') || cond.includes('deteriorado')) return 'badge-danado';
    return 'badge-default';
  }

  // ---------------------------
  // TIPOS Y UBICACIONES
  // ---------------------------
  cargarTipos() {
    this.tipoService.getTipoArticulos().subscribe({
      next: data => this.tipos = data,
      error: () => Swal.fire('Error', 'No se pudieron cargar los tipos', 'error')
    });
  }

  cargarUbicaciones() {
    this.ubicService.getUbicaciones().subscribe({
      next: data => this.ubicaciones = data,
      error: () => this.ubicaciones = []
    });
  }

  obtenerTipoArticulo(id: number) {
    return this.tipos.find(t => t.id === id)?.nombre || '-';
  }

  obtenerUbicacion(id: number) {
    return this.ubicaciones.find(u => u.id === id)?.nombre || '-';
  }

  // ---------------------------
  // FORMULARIO DINÁMICO
  // ---------------------------
  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.resetForm();
  }

  onTipoChange() {
    if (this.editando && this.articulo.camposValores.length > 0) return;

    this.camposDelTipo = [];
    this.articulo.camposValores = [];

    if (!this.articulo.tipoArticuloId) return;

    this.campoService.getCamposByTipoArticulo(this.articulo.tipoArticuloId).subscribe({
      next: (res: any) => {
        const campos = Array.isArray(res) ? res : res.campos ?? [];

        this.camposDelTipo = campos.map((c: any) => ({
          id: c.id,
          nombreCampo: c.nombreCampo ?? c.nombre,
          tipoDato: c.tipoDato ?? c.tipo ?? 'texto',
          opciones: c.opciones ?? []
        }));

        this.articulo.camposValores = this.camposDelTipo.map((c: any) => ({
          id: 0,
          articuloId: 0,
          campoArticuloId: c.id,
          valor: ''
        }));
      }
    });
  }

  // ---------------------------
  // GUARDAR / EDITAR
  // ---------------------------
  guardar() {
    if (this.articulo.id) {
      const urlQR = `http://localhost:4200/tipos-articulos/articulo/${this.articulo.id}`;
      this.articulo.qrCodeBase64 = this.generarQR(urlQR);
    }
    if (!this.articulo.fechaAdquision) {
      this.articulo.fechaAdquision = new Date().toISOString();
    } else {
      this.articulo.fechaAdquision = new Date(this.articulo.fechaAdquision).toISOString();
    }

    const payload = { ...this.articulo };
    if (this.editando) {
      this.articuloService.updateArticuloConCampos(payload).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Artículo actualizado correctamente', 'success');
          this.toggleFormulario();
          this.listarArticulos();
          this.resetForm();
        }
      });
    } else {
      this.articuloService.addArticuloConCampos(payload).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Artículo guardado correctamente', 'success');
          this.toggleFormulario();
          this.listarArticulos();
          this.resetForm();
        }
      });
    }
  }

  verArticulo(a: any) {
    this.cargarParaVerComun(a);
    this.editando = false;
    this.mostrarFormulario = true;
  }

  editarArticulo(a: any) {
    this.cargarParaVerComun(a);
    this.editando = true;
    this.mostrarFormulario = true;
  }

  cargarParaVerComun(art: any) {
    this.articulo = { ...art };
    if (this.articulo.fechaAdquision) {
      const d = new Date(this.articulo.fechaAdquision);
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const dia = d.getDate().toString().padStart(2, '0');
      this.articulo.fechaAdquision = `${d.getFullYear()}-${mes}-${dia}`;
    }
    if (!this.articulo.qrCodeBase64 && this.articulo.id) {
      const urlQR = `http://localhost:4200/tipos-articulos/articulo/${this.articulo.id}`;
      this.articulo.qrCodeBase64 = this.generarQR(urlQR);
    }

    this.camposDelTipo = [];
    if (!this.articulo.tipoArticuloId) return;

    this.campoService.getCamposByTipoArticulo(this.articulo.tipoArticuloId).subscribe({
      next: (res: any) => {
        const campos = Array.isArray(res) ? res : res.campos ?? [];
        this.camposDelTipo = campos.map((c: any) => ({
          id: c.id,
          nombreCampo: c.nombreCampo ?? c.nombre,
          tipoDato: c.tipoDato ?? c.tipo ?? 'texto',
          opciones: c.opciones ?? []
        }));

        this.articulo.camposValores = this.camposDelTipo.map((c: any) => {
          const valorExistente = this.articulo.camposValores?.find((cv: any) => cv.campoArticuloId === c.id);
          return {
            id: valorExistente?.id ?? 0,
            articuloId: this.articulo.id,
            campoArticuloId: c.id,
            valor: valorExistente?.valor ?? ''
          };
        });
      }
    });
  }

  eliminarArticulo(id: number) {
    Swal.fire({
      title: '¿Eliminar artículo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.articuloService.deleteArticulo(id).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Artículo eliminado', 'success');
            this.listarArticulos();
          }
        });
      }
    });
  }

  resetForm() {
    this.editando = false;
    this.articulo = this.crearArticuloVacio();
    this.camposDelTipo = [];
  }

  crearArticuloVacio() {
    return {
      id: 0,
      qrCodeBase64: '',
      codigoPatrimonial: '',
      nombre: '',
      fechaAdquision: '',
      valorAdquisitivo: null,
      condicion: '',
      tipoArticuloId: 0,
      ubicacionId: 0,
      estado: 1,
      camposValores: [],
      vidaUtil: null
    };
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
  }
}