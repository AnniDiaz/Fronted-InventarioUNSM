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

  // Formulario de reporte integrado con Mantenimiento
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

        // Cargar ubicación real
        if (this.articulo && this.articulo.ubicacionId) {
          this.ubicacionService.getUbicacionById(this.articulo.ubicacionId).subscribe({
            next: (u: any) => {
              this.articulo.ubicacion = u.data;
            },
            error: (err) => console.error('Error al cargar ubicación', err)
          });
        }

        // Cargar tipo de artículo real
        if (this.articulo && this.articulo.tipoArticuloId) {
          this.tipoArticuloService.getTipoArticuloById(this.articulo.tipoArticuloId).subscribe({
            next: (t: any) => {
              // Si el backend también envuelve esto en ApiResponse
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
      EstadoMantenimiento: true, // PENDIENTE
      Observaciones: this.reporte.descripcion
    };

    this.mantenimientoService.addMantenimiento(payload).subscribe({
      next: (res) => {
        Swal.fire({
          title: '¡Incidencia Registrada!',
          text: 'Se ha creado un registro en el módulo de mantenimiento.',
          icon: 'success',
          confirmButtonColor: '#00a468'
        });
        this.mostrarModalReporte = false;
        this.mostrarReporte = false;
        // Limpiar form
        this.reporte = {
          tipo: 'Correctivo',
          fecha: new Date().toISOString().split('T')[0],
          proveedor: '',
          costo: 0,
          descripcion: ''
        };
      },
      error: (err) => {
        console.error('Error al registrar incidencia', err);
        Swal.fire('Error', 'No se pudo registrar la incidencia', 'error');
      }
    });
  }
}