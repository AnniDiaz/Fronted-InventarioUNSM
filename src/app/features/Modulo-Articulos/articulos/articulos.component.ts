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
verArticulo(a: any) {
  this.editando = false;           // Modo solo lectura
  this.articulo = { ...a };        // Copiamos los datos del artículo

  // Convertir fecha a formato YYYY-MM-DD para <input type="date">
  if (this.articulo.fechaAdquision) {
    const d = new Date(this.articulo.fechaAdquision);
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    this.articulo.fechaAdquision = `${d.getFullYear()}-${mes}-${dia}`;
  }

  // Generar QR si no existe
  if (!this.articulo.qrCodeBase64 && this.articulo.id) {
    const urlQR = `http://localhost:4200/tipos-articulos/articulo/${this.articulo.id}`;
    this.articulo.qrCodeBase64 = this.generarQR(urlQR);
  }

  // Cargar campos dinámicos según el tipo
  this.camposDelTipo = [];
  if (!this.articulo.tipoArticuloId) {
    this.mostrarFormulario = true;
    return;
  }

  this.campoService.getCamposByTipoArticulo(this.articulo.tipoArticuloId).subscribe({
    next: (res: any) => {
      const campos = Array.isArray(res) ? res : res.campos ?? [];
      this.camposDelTipo = campos.map((c: any) => ({
        id: c.id,
        nombreCampo: c.nombreCampo ?? c.nombre,
        tipoDato: c.tipoDato ?? c.tipo ?? 'texto',
        opciones: c.opciones ?? []
      }));

      // Mapear valores existentes
      this.articulo.camposValores = this.camposDelTipo.map((c: any) => {
        const valorExistente = this.articulo.camposValores?.find((cv: any) => cv.campoArticuloId === c.id);
        return {
          id: valorExistente?.id ?? 0,
          articuloId: this.articulo.id,
          campoArticuloId: c.id,
          valor: valorExistente?.valor ?? ''
        };
      });

      this.mostrarFormulario = true; // Abrir modal
    }
  });
}

  mostrarFormulario = false;
  filtro = '';
  paginaActual = 1;
  pageSize = 5;
  totalPaginas = 1;
  registrosPaginados: any[] = [];

  articulos: any[] = [];
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
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarUbicaciones();
    this.listarArticulos();
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
    return qr.toDataURL(); // Devuelve directamente data:image/png;base64
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

  isQRCode(campo: any): boolean {
    return campo.tipoDato === 'qr' || campo.nombreCampo?.toLowerCase().includes('qr');
  }

  getValue(articulo: any, campo: any): string {
    if (!articulo || !articulo.camposValores) return '';
    const cv = articulo.camposValores.find((c: any) => c.campoArticuloId === campo.id);
    return cv?.valor ?? '';
  }

  // ---------------------------
  // FILTRO Y PAGINACIÓN
  // ---------------------------
  aplicarFiltro() {
    this.paginaActual = 1;
    this.listarArticulos();
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;
    this.paginaActual = nueva;
    this.listarArticulos();
  }
listarArticulos() {
  this.articuloService.getArticulosConCampos().subscribe({
    next: (data: any[]) => {
      this.articulos = data.map(a => {
        // Generar QR para cada artículo
        if (a.id) {
          const urlQR = `http://localhost:4200/tipos-articulos/articulo/${a.id}`;
          a.qrCodeBase64 = this.generarQR(urlQR);
        }
        return a;
      });

      // Paginación y filtro
      this.totalPaginas = Math.ceil(this.articulos.length / this.pageSize);
      const inicio = (this.paginaActual - 1) * this.pageSize;
      const fin = inicio + this.pageSize;
      this.registrosPaginados = this.articulos.slice(inicio, fin);
    },
    error: (err) => {
      console.error('Error al listar artículos:', err);
      Swal.fire('Error', 'No se pudieron cargar los artículos', 'error');
    }
  });
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
      // Generar QR con URL si no tiene
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

  editarArticulo(a: any) {
    this.cargarParaEditar(a);
    this.mostrarFormulario = true;
  }

cargarParaEditar(art: any) {
  this.editando = true;
  this.articulo = { ...art };

  // Convertir fecha a formato YYYY-MM-DD para <input type="date">
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

  // Cargar campos dinámicos
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
      confirmButtonText: 'Sí, eliminar'
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
      valorAdquisitivo: 0,
      condicion: '',
      tipoArticuloId: 0,
      ubicacionId: 0,
      estado: 1,
      camposValores: [],
      vidaUtil: 0
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
