import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticuloService } from '../../../core/services/articulos.service';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../shared/components/sidebar/sidebar.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipoArticuloService } from '../../../core/services/tipo-articulos.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import Swal from 'sweetalert2';

import Qrious from 'qrious';   // ⬅️ IMPORTANTE PARA GENERAR QR

@Component({
  selector: 'app-articulo-tipo-articulo',
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './articulo-tipo-articulo.component.html',
  styleUrls: ['./articulo-tipo-articulo.component.css']
})
export class ArticuloTipoArticuloComponent implements OnInit {

  articulos: any[] = [];
  articulosFiltrados: any[] = [];
  filtro: string = '';
  tipoArticuloId!: number;
  nombreTipoArticulo: string = '';
  encabezados: string[] = [];

  camposDefinidos: { id: number, nombreCampo: string, tipoDato: string, tipoArticuloId: number }[] = [];
  ubicaciones: { id: number, nombre: string }[] = [];

  mostrarFormulario = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  formulario: any = {};

  constructor(
    private route: ActivatedRoute,
    private articuloService: ArticuloService,
    private tipoArticuloService: TipoArticuloService,
    private ubicacionService: UbicacionService
  ) {}

  ngOnInit(): void {
    this.tipoArticuloId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarArticulos(this.tipoArticuloId);
    this.cargarUbicaciones();

    this.tipoArticuloService.getTipoArticuloById(this.tipoArticuloId).subscribe({
      next: (data: any) => this.nombreTipoArticulo = data.nombre || `Tipo ID ${this.tipoArticuloId}`,
      error: () => this.nombreTipoArticulo = `Tipo ID ${this.tipoArticuloId}`
    });
  }


  generarQR(texto: string): string {
    if (!texto) return '';

    const qr = new Qrious({
      value: texto,
      size: 180,
      level: 'H'
    });

    // Devuelve PNG en Base64 (sin prefijo data:image)
    return qr.toDataURL().split(',')[1];
  }

  // =============================================
  //                CARGAR ARTÍCULOS
  // =============================================
  cargarArticulos(id: number) {
    this.articuloService.getPivotPorTipo(id).subscribe({
      next: (data) => {

        if (!Array.isArray(data) || data.length === 0) {
          this.encabezados = [];
          this.articulos = [];
          this.articulosFiltrados = [];
          return;
        }

        // claves sin objetos
        const rawKeys = Object.keys(data[0]).filter(k =>
          typeof data[0][k] !== 'object' || data[0][k] === null
        );

        this.encabezados = rawKeys;

        // ===== GENERAR QR EN FRONTEND =====
        data.forEach(a => {
          rawKeys.forEach(campo => {
            if (this.isQRCode(campo)) {
              const valor = a[campo];
              if (valor && valor.trim() !== '') {
                a[campo] = this.generarQR(valor); // 🔥 Convertido a PNG
              }
            }
          });
        });

        this.articulos = data;
        this.articulosFiltrados = data;
      },
      error: (err) => console.error('Error al obtener artículos pivot', err)
    });
  }

  aplicarFiltro() {
    if (!this.filtro.trim()) {
      this.articulosFiltrados = this.articulos;
      return;
    }
    const f = this.filtro.toLowerCase();
    this.articulosFiltrados = this.articulos.filter(a =>
      JSON.stringify(a).toLowerCase().includes(f)
    );
  }

  // =============================================
  //               VALIDADORES
  // =============================================
  isQRCode(campo: string) { return campo?.toLowerCase().includes('qr'); }
  isEstado(campo: string) { return campo?.toLowerCase() === 'estado'; }
  isFecha(campo: string) { return campo.toLowerCase().includes('fecha'); }
  isNumero(campo: string) {
    const posibles = ['valor', 'precio', 'cantidad', 'stock', 'vida', 'util', 'id'];
    return posibles.some(p => campo.toLowerCase().includes(p));
  }

  getValue(articulo: any, campo: string): any {
    if (!articulo || !campo) return '';
    return articulo[campo]
      ?? articulo[campo.toLowerCase()]
      ?? articulo[campo.charAt(0).toUpperCase() + campo.slice(1)]
      ?? '';
  }

  formatEstado(val: any) {
    if (val === 1 || val === '1') return 'Activo';
    if (val === 0 || val === '0') return 'Inactivo';
    return val ?? '';
  }

  // =============================================
  //               FORMULARIO
  // =============================================
  abrirFormularioCrear() {
    this.modoFormulario = 'crear';
    this.formulario = {};

    this.articuloService.getCamposPorTipo(this.tipoArticuloId).subscribe({
      next: (campos: any[]) => {
        this.camposDefinidos = campos;

        campos.forEach(c => this.formulario[c.nombreCampo] = '');

        this.formulario['CodigoPatrimonial'] = '';
        this.formulario['Nombre'] = '';
        this.formulario['FechaAdquision'] = new Date().toISOString().substring(0, 10);
        this.formulario['ValorAdquisitivo'] = 0;
        this.formulario['TipoArticuloId'] = this.tipoArticuloId;
        this.formulario['Estado'] = 1;
        this.formulario['Condicion'] = 'Bueno';
        this.formulario['VidaUtil'] = 0;

        if (this.ubicaciones.length === 0) this.cargarUbicaciones();
        this.formulario['UbicacionId'] =
          this.ubicaciones.length > 0 ? this.ubicaciones[0].id : 0;

        this.mostrarFormulario = true;
      }
    });
  }

  editarArticulo(articulo: any) {
    this.modoFormulario = 'editar';
    this.formulario = { ...articulo };
    this.mostrarFormulario = true;

    this.articuloService.getCamposPorTipo(this.tipoArticuloId).subscribe({
      next: (campos: any[]) => {
        this.camposDefinidos = campos;
        campos.forEach(c => {
          if (!(c.nombre in this.formulario)) this.formulario[c.nombre] = '';
        });
      }
    });
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
  }
guardarArticulo() {
  const camposValores = this.camposDefinidos.map(c => ({
    campoArticuloId: c.id,
    valor: this.formulario[c.nombreCampo]?.toString().trim() || ''
  }));

  const articuloRequest = {
    codigoPatrimonial: this.formulario['CodigoPatrimonial'],
    nombre: this.formulario['Nombre'],
    fechaAdquision: this.formulario['FechaAdquision'],
    valorAdquisitivo: Number(this.formulario['ValorAdquisitivo']),
    condicion: this.formulario['Condicion'],
    tipoArticuloId: Number(this.formulario['TipoArticuloId']),
    ubicacionId: Number(this.formulario['UbicacionId']),
    estado: Number(this.formulario['Estado']),
    vidaUtil: Number(this.formulario['VidaUtil']),
    camposValores
  };

  this.articuloService.addArticuloConCampos(articuloRequest).subscribe({
    next: () => {

      // 🔥 SWEET ALERT DE ÉXITO
      Swal.fire({
        icon: 'success',
        title: 'Artículo registrado',
        text: 'El artículo se agregó exitosamente.',
        showConfirmButton: false,
        timer: 2000
      });

      this.mostrarFormulario = false;
      this.cargarArticulos(this.tipoArticuloId);
    },
    error: () => {

      // ❌ SWEET ALERT DE ERROR
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo registrar el artículo.',
      });

    }
  });
}


  subirQR(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      this.formulario["QRCodeBase64"] = base64;
    };
    reader.readAsDataURL(file);
  }
    cargarUbicaciones() {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (data: any[]) => this.ubicaciones = data,
      error: (err) => console.error('Error al cargar ubicaciones', err)
    });
  }

}


