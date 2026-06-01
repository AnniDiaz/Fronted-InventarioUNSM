import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { HeaderComponent } from "../../shared/components/header/header.component";

import { ArticuloService } from '../../core/services/articulos.service';

@Component({
  selector: 'app-doc-prestamos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HeaderComponent
  ],
  templateUrl: './doc-prestamos.component.html',
  styleUrls: ['./doc-prestamos.component.css']
})
export class DocPrestamosComponent implements OnInit {

  constructor(
    private articuloService: ArticuloService
  ) {}

  // =========================
  // ARTICULOS
  // =========================

  articulos: any[] = [];

  equipo = '';

  // =========================
  // FORMULARIO
  // =========================

  destinatario = '';

  nombre = '';
  dni = '';
  ciclo = '';

  escuela = '';
  direccion = '';
  correo = '';

  detalle = '';

  fechaInicio = '';
  fechaFin = '';

  ciudad = '';
  fechaDocumento = '';

  acompanantes: string[] = [];

  nuevoAcompanante = '';

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {

    this.listarArticulos();
  }

  // =========================
  // LISTAR ARTICULOS
  // =========================

  listarArticulos() {

    this.articuloService.getArticulosConCampos().subscribe({

      next: (res: any) => {

        this.articulos =
          Array.isArray(res)
          ? res
          : res.data ?? [];

        console.log('ARTICULOS:', this.articulos);
      },

      error: (err) => {

        console.error(
          'Error al cargar artículos',
          err
        );
      }
    });
  }

  // =========================
  // ACOMPAÑANTES
  // =========================

  agregarAcompanante() {

    if (this.nuevoAcompanante.trim()) {

      this.acompanantes.push(
        this.nuevoAcompanante
      );

      this.nuevoAcompanante = '';
    }
  }

  eliminarAcompanante(index: number) {

    this.acompanantes.splice(index, 1);
  }

  // =========================
  // IMPRIMIR
  // =========================

  imprimir() {

    window.print();
  }

  // =========================
  // LIMPIAR
  // =========================

  limpiarFormulario() {

    this.equipo = '';

    this.destinatario = '';

    this.nombre = '';
    this.dni = '';
    this.ciclo = '';

    this.escuela = '';
    this.direccion = '';
    this.correo = '';

    this.detalle = '';

    this.fechaInicio = '';
    this.fechaFin = '';

    this.ciudad = '';
    this.fechaDocumento = '';

    this.acompanantes = [];
  }
}
