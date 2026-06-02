import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticuloService } from '../../../core/services/articulos.service';
import { SidebarComponent } from "../../../shared/components/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MantenimientoService } from '../../../core/services/mantenimiento.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { TipoArticuloService } from '../../../core/services/tipo-articulos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-detalles-articulo',
  templateUrl: './detalles-articulo.component.html',
  styleUrls: ['./detalles-articulo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class DetallesArticuloComponent implements OnInit {

  articulo: any;
  idArticulo!: number;

  mostrarReporte: boolean = false;
  mostrarModalReporte: boolean = false;

  reporte = {
    tipo: 'Correctivo',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    costo: 0,
    descripcion: ''
  };

  constructor(
    private route: ActivatedRoute,
    private articuloService: ArticuloService,
    private mantenimientoService: MantenimientoService,
    private ubicacionService: UbicacionService,
    private tipoArticuloService: TipoArticuloService,
    private location: Location
  ) {}

  irAtras() {
    this.location.back();
  }

  ngOnInit(): void {
    this.idArticulo = Number(this.route.snapshot.paramMap.get('id'));
    this.getArticuloDetalles();
  }

  getArticuloDetalles() {
    this.articuloService.getArticuloById(this.idArticulo).subscribe({
      next: (res) => {
        console.log('Artículo cargado:', res);

        this.articulo = res.data;

        // 🔥 SI NO HAY CAMPOS DINÁMICOS, LOS GENERAMOS
        if (!this.articulo.camposValores || this.articulo.camposValores.length === 0) {
          this.articulo.camposValores = [
            { nombreCampo: 'Marca', valor: this.articulo.marca },
            { nombreCampo: 'Modelo', valor: this.articulo.modelo },
            { nombreCampo: 'Serie', valor: this.articulo.nroSerie },
            { nombreCampo: 'Color', valor: this.articulo.color },
            { nombreCampo: 'Medidas', valor: this.articulo.medidas },
            { nombreCampo: 'Condición', valor: this.articulo.condicion },
            { nombreCampo: 'Código Patrimonial', valor: this.articulo.codigoPatrimonial },
            { nombreCampo: 'Valor Adquisición', valor: `S/ ${this.articulo.valorAdquisitivo}` }
          ];
        }

        // Ubicación
        if (this.articulo?.ubicacionId) {
          this.ubicacionService.getUbicacionById(this.articulo.ubicacionId).subscribe({
            next: (u: any) => {
              this.articulo.ubicacion = u.data;
            },
            error: (err) => console.error('Error al cargar ubicación', err)
          });
        }

        // Tipo de artículo
        if (this.articulo?.tipoArticuloId) {
          this.tipoArticuloService.getTipoArticuloById(this.articulo.tipoArticuloId).subscribe({
            next: (t: any) => {
              this.articulo.tipoArticulo = t.data || t;
            },
            error: (err) => console.error('Error al cargar tipo de artículo', err)
          });
        }
      },
      error: (err) => console.error('Error al traer el artículo', err)
    });
  }

  toggleModalReporte() {
    this.mostrarModalReporte = !this.mostrarModalReporte;
  }

  guardarReporte() {
    const payload = {
      ArticuloId: this.idArticulo,
      TipoMantenimiento: this.reporte.tipo,
      FechaMantenimiento: new Date(this.reporte.fecha).toISOString(),
      ProveedorServicion: this.reporte.proveedor || 'SIN ASIGNAR',
      Costo: Number(this.reporte.costo) || 0,
      EstadoMantenimiento: true,
      Observaciones: this.reporte.descripcion
    };

   this.mantenimientoService.addMantenimiento(payload).subscribe({
  next: () => {
    Swal.fire({
      title: '¡Incidencia Registrada!',
      text: 'Se ha creado un registro en mantenimiento.',
      icon: 'success',
      confirmButtonColor: '#00a468'
    });

    this.mostrarModalReporte = false;

    this.reporte = {
      tipo: 'Correctivo',
      fecha: new Date().toISOString().split('T')[0],
      proveedor: '',
      costo: 0,
      descripcion: ''
    };
  },
error: (err) => {
  console.error(err);

  let raw = '';

  // 🔥 capturamos todo lo posible
  if (typeof err?.error === 'string') {
    raw = err.error;
  } else if (typeof err?.message === 'string') {
    raw = err.message;
  } else if (err?.error) {
    raw = JSON.stringify(err.error);
  }

  // 🔥 LIMPIEZA FORZADA DEL STACK TRACE
  const mensaje = raw
    .split(' at ')[0]   // corta el stack trace
    .replace('System.Exception:', '')
    .replace('System.Exception', '')
    .trim();

  Swal.fire({
    icon: 'warning',
    title: 'No se pudo registrar',
    text: mensaje || 'Error desconocido'
  });


  }
});
  }
}
