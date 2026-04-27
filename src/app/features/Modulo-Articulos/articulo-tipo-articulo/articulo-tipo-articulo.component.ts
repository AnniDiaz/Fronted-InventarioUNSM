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
columnaAlias: Record<string, string> = {
  TipoArticuloId: 'Tipo',
  UbicacionId: 'Ubicación',
  vidaUtil: 'Duración',
  QRCodeBase64: 'QR',
  CodigoPatrimonial: 'Código',
  Nombre: 'Nombre',
  FechaAdquision: 'Fecha',
  ValorAdquisitivo: 'Valor',
  Condicion: 'Condición',
  Estado: 'Estado',
  Id: 'ID',
  Marca: 'Marca',
  Modelo: 'Modelo',
  Procesador: 'Procesador'
};
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
  next: (response: any) => {

const data = response?.data;

const tipo = Array.isArray(data)
  ? data.find((x: any) => Number(x.id) === Number(this.tipoArticuloId))
  : data && Number(data.id) === Number(this.tipoArticuloId)
    ? data
    : null;

    this.nombreTipoArticulo = tipo?.nombre ?? `Tipo ID ${this.tipoArticuloId}`;
  },
  error: () => {
    this.nombreTipoArticulo = `Tipo ID ${this.tipoArticuloId}`;
  }
});
  }
get safeEncabezados(): string[] {
  return Array.isArray(this.encabezados)
    ? this.encabezados
    : Object.keys(this.encabezados || {});
}
 generarQR(texto: string): string {
  if (!texto) return '';

  const qr = new Qrious({
    value: texto,
    size: 180,
    level: 'H'
  });

  return qr.toDataURL(); // 🔥 devuelve imagen completa
}
cargarArticulos(id: number) {
  this.articuloService.getPivotPorTipo(id).subscribe({
    next: (res: any) => {

      const dataRaw = res?.data;

      // 🔥 FORZAR ARRAY SIEMPRE
      const data = Array.isArray(dataRaw)
        ? dataRaw
        : dataRaw
          ? [dataRaw]
          : [];

      if (data.length === 0) {
        this.encabezados = [];
        this.articulos = [];
        this.articulosFiltrados = [];
        return;
      }

      const cleanedData = data.map((item: any) => {
        const newItem: any = {};
        Object.keys(item || {}).forEach(k => {
          newItem[k.trim()] = item[k];
        });
        return newItem;
      });

      // 🔥 ENCABEZADOS SIEMPRE ARRAY
      this.encabezados = Object.keys(cleanedData[0] || {});

      // 🔥 FORZAR ARRAYS
      this.articulos = [...cleanedData];
      this.articulosFiltrados = [...cleanedData];
    },
    error: (err) => {
      console.error('Error al obtener artículos pivot', err);
      this.articulos = [];
      this.articulosFiltrados = [];
      this.encabezados = [];
    }
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
  const key = Object.keys(articulo).find(k => k.trim() === campo.trim());

  const value = key ? articulo[key] : '';

  // 🔥 evitar romper imagen QR
  if (campo.toLowerCase().includes('qr')) {
    return value?.startsWith('data:')
      ? value.replace('data:image/png;base64,', '')
      : value;
  }

  return value;
}
columnasOcultas = new Set([
  'TipoArticuloId',
  'UbicacionId',
  'Estado'
]);
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
  next: (res: any) => {

const camposRaw = res?.data;

const campos = Array.isArray(camposRaw)
  ? camposRaw
  : camposRaw
    ? [camposRaw]
    : [];
    this.camposDefinidos = campos;

    campos.forEach((c: any) => {
      this.formulario[c.nombreCampo] = '';
    });

    this.formulario['CodigoPatrimonial'] = '';
    this.formulario['Nombre'] = '';
    this.formulario['FechaAdquision'] = new Date().toISOString().substring(0, 10);
    this.formulario['ValorAdquisitivo'] = 0;
    this.formulario['TipoArticuloId'] = this.tipoArticuloId;
    this.formulario['Estado'] = 1;
    this.formulario['Condicion'] = 'Bueno';
    this.formulario['VidaUtil'] = 0;

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
    next: (res: any) => {

      const raw = res?.data?.data ?? res?.data ?? res;

      const lista = Array.isArray(raw) ? raw : [];

      this.ubicaciones = lista.map((u: any) => ({
        id: u.id ?? u.Id,
        nombre: u.nombre ?? u.Nombre
      }));

      console.log('UBICACIONES OK:', this.ubicaciones);
    },
    error: (err) => {
      console.error('Error al cargar ubicaciones', err);
      this.ubicaciones = [];
    }
  });
}

}


