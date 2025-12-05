import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { ArticuloService } from '../../core/services/articulos.service';
import { CamposArticuloService } from '../../core/services/campos-articulo.service';
import { TipoArticuloService } from '../../core/services/tipo-articulos.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-articulo-form',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './articulos.component.html',
  styleUrls: ['./articulos.component.css']
})
export class ArticuloFormComponent implements OnInit {

   mostrarFormulario: boolean = false;
  filtro: string = '';
  paginaActual: number = 1;
  pageSize: number = 3;
  totalPaginas: number = 1;
  registrosPaginados: any[] = [];

   articulos: any[] = [];
  tipos: any[] = [];
  ubicaciones: any[] = [];
  camposDelTipo: any[] = [];

   articulo: any = {
    id: 0,
    tipoArticuloId: 0,
    ubicacionId: 0,
    estado: 1,
    camposValores: [],
    stock: 0,
  };

  editando: boolean = false;

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

   toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) this.resetForm();
  }

   aplicarFiltro() {
    this.paginaActual = 1;
    this.listarArticulos();
  }

   listarArticulos() {
    this.articuloService.getArticulos().subscribe({
      next: (data: any[]) => {
        let lista = data;

        // FILTRO
        if (this.filtro.trim().length > 0) {
          lista = lista.filter(a =>
            a.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
            a.descripcion?.toLowerCase().includes(this.filtro.toLowerCase())
          );
        }
        this.totalPaginas = Math.ceil(lista.length / this.pageSize);
        const inicio = (this.paginaActual - 1) * this.pageSize;
        const fin = inicio + this.pageSize;

        this.registrosPaginados = lista.slice(inicio, fin);
      }
    });
  }

  cambiarPagina(nueva: number) {
    if (nueva < 1 || nueva > this.totalPaginas) return;

    this.paginaActual = nueva;
    this.listarArticulos();
  }

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

   onTipoChange() {
    if (this.editando && this.articulo.camposValores.length > 0) {
      return;
    }

    this.camposDelTipo = [];
    this.articulo.camposValores = [];

    if (!this.articulo.tipoArticuloId) return;

    this.campoService.getCamposByTipoArticulo(this.articulo.tipoArticuloId).subscribe({
      next: (res: any) => {
        let campos = Array.isArray(res) ? res : (res.campos ?? []);

        this.camposDelTipo = campos.map((c: any) => ({
          id: c.id,
          nombreCampo: c.nombreCampo ?? c.nombre,
          tipoDato: c.tipoDato ?? c.tipo ?? 'texto'
        }));

        if (this.articulo.camposValores.length === 0) {
          this.articulo.camposValores = this.camposDelTipo.map((c: any) => ({
            id: 0,
            articuloId: 0,
            campoArticuloId: c.id,
            valor: ''
          }));
        }
      }
    });
  }

  guardar() {
    const payload = {
      id: this.articulo.id,
      tipoArticuloId: this.articulo.tipoArticuloId,
      ubicacionId: this.articulo.ubicacionId,
      estado: this.articulo.estado,
      camposValores: this.articulo.camposValores,
      stock: this.articulo.stock,
    };

    if (this.editando) {
      this.articuloService.updateArticuloConCampos(payload).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Artículo actualizado correctamente', 'success');
          this.toggleFormulario();
          this.listarArticulos();
          this.resetForm();
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
      });
    } else {
      this.articuloService.addArticuloConCampos(payload).subscribe({
        next: () => {
          Swal.fire('Éxito', 'Artículo guardado correctamente', 'success');
          this.toggleFormulario();
          this.listarArticulos();
          this.resetForm();
        },
        error: () => Swal.fire('Error', 'No se pudo guardar', 'error')
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
    this.camposDelTipo = [];

    if (!this.articulo.tipoArticuloId) return;
    this.campoService.getCamposByTipoArticulo(this.articulo.tipoArticuloId).subscribe({
      next: (res: any) => {
        let campos = Array.isArray(res) ? res : (res.campos ?? []);
        
        this.camposDelTipo = campos.map((c: any) => ({
          id: c.id,
          nombreCampo: c.nombreCampo ?? c.nombre,
          tipoDato: c.tipoDato ?? c.tipo ?? 'texto'
        }));

        this.articulo.camposValores = this.camposDelTipo.map((c: any) => {
          const valorExistente = art.camposValores?.find((cv: any) => cv.campoArticuloId === c.id);
          return {
            id: valorExistente?.id ?? 0,
            articuloId: art.id,
            campoArticuloId: c.id,
            valor: valorExistente?.valor ?? ''
          };
        });
      }
    });
  }

  eliminarArticulo(id: number) {
    this.eliminar(id);
  }

  eliminar(id: number) {
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
    this.articulo = {
      id: 0,
      tipoArticuloId: 0,
      ubicacionId: 0,
      estado: 1,
      camposValores: [],
      stock: 0,
    };
    this.camposDelTipo = [];
  }
}
