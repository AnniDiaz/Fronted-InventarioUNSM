
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { ArticuloService } from '../../core/services/articulos.service';
import { SolicitantesComponent } from '../solicitantes/solicitantes.component';
import { SolicitantesService } from '../../core/services/solicitantes.service';
import { PrestamosService } from '../../core/services/prestamos.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-doc-prestamos',
  standalone: true,
imports: [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatAutocompleteModule,
  MatInputModule,
  MatFormFieldModule,
  MatOptionModule,
  MatIconModule,
  SidebarComponent,
  HeaderComponent
],
  templateUrl: './doc-prestamos.component.html',
  styleUrls: ['./doc-prestamos.component.css']
})
export class DocPrestamosComponent implements OnInit {
solicitantes: any[] = [];
solicitantesFiltrados: any[] = [];
solicitanteSeleccionado: any = null;
@ViewChild('documentoPDF', { static: false })
documentoPDF!: ElementRef;

nombreSolicitanteCtrl = '';
  constructor(
    private articuloService: ArticuloService,
    private solicitanteService: SolicitantesService,
      private prestamoService: PrestamosService,
        private router: Router


  ) {}

  articulos: any[] = [];
articuloId: number = 0;  equipo = '';

prestamos: any[] = [];
  destinatario = '';

  // REPRESENTANTE RESPONSABLE

  nombre = '';
  dni = '';
  ciclo = '';
telefono = '';
  escuela = '';
  direccion = '';
  correo = '';

  // PROYECTO

  actividad = '';

  // LUGAR DE USO

  lugarUso = '';

  // MOTIVO

  detalle = '';

  // FECHAS
solicitanteId: number = 0;
  fechaInicio = '';
  fechaFin = '';

  // UBICACIÓN DOCUMENTO

  ciudad = '';
  fechaDocumento = '';

  // =========================
  // PARTICIPANTES
  // =========================

  participantes: any[] = [];

  nuevoParticipante = {
    nombre: '',
    dni: '',
    codigo: '',
    correo: ''
  };

  // =========================
  // INIT
  // =========================

  ngOnInit(): void {

    this.listarArticulos();
  this.listarSolicitantes(); // 👈 TE FALTA ESTO

    const hoy = new Date();

    this.fechaDocumento =
      hoy.toISOString().split('T')[0];
  }
mostrarSolicitante = (s: any): string => {
  return s ? `${s.nombres} ${s.apellidos}` : '';
};

listarSolicitantes(): void {
  this.solicitanteService.getSolicitantes().subscribe({
    next: (res: any) => {
      this.solicitantes = res.data ?? [];
      this.solicitantesFiltrados = this.solicitantes;
    }
  });
}
ngAfterViewInit(): void {
  // No hacemos nada si no hay referencia en HTML
}

async generarPrestamo(): Promise<void> {

  const prestamo = {
    articuloId: this.articuloId,
    solicitanteId: this.solicitanteId,
    nombreSolicitante: this.nombre,
    fechaPrestamo: this.fechaInicio
      ? new Date(this.fechaInicio).toISOString()
      : new Date().toISOString(),
    fechaDevolucion: this.fechaFin
      ? new Date(this.fechaFin).toISOString()
      : new Date().toISOString(),
    estado: 0,
    estadoPrestamo: true
  };

  this.prestamoService.addPrestamo(prestamo).subscribe({
    next: async (res: any) => {

      const pdfBlob = await this.generarPDFBlob();

      const formData = new FormData();
      formData.append('file', pdfBlob, 'prestamo.pdf');
      formData.append('prestamoId', String(res.data?.id ?? res.id));

      this.prestamoService.uploadPDF(formData).subscribe({
        next: () => {

          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Préstamo y PDF guardados correctamente',
             confirmButtonText: 'OK'

          }).then(() => {
            this.limpiarFormulario();
            this.router.navigate(['/prestamos']);
          });

        },
        error: (err) => {

          console.error(err);

          Swal.fire({
            icon: 'error',
            title: 'Error al subir PDF',
            text: err?.error?.message || 'Ocurrió un problema al guardar el PDF'
          });

        }
      });

    },
    error: (err) => {

      console.error(err);

      Swal.fire({
        icon: 'error',
        title: 'Error al crear préstamo',
        text: err?.error?.errors || 'No se pudo generar el préstamo'
      });

    }
  });
}

async generarPDFBlob(): Promise<Blob> {
  const element = this.documentoPDF.nativeElement;

  const canvas = await html2canvas(element, {
    scale: 2
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgProps = pdf.getImageProperties(imgData);

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  return pdf.output('blob'); // 🔥 importante
}
filtrarSolicitantes(event: any): void {
  const value = event.target.value.toLowerCase();

  this.solicitantesFiltrados = this.solicitantes.filter(s =>
    (s.nombres + ' ' + s.apellidos + ' ' + s.codigo)
      .toLowerCase()
      .includes(value)
  );
}
seleccionarSolicitante(s: any): void {
  this.solicitanteSeleccionado = s;

  this.nombre = `${s.nombres} ${s.apellidos}`;
  this.dni = s.dni ?? s.codigo;
  this.ciclo = s.ciclo;
  this.correo = s.correo;

  this.telefono = s.telefono ?? ''; // 👈 AÑADIR ESTO

  this.escuela = s.escuela ?? '';
  this.direccion = s.direccion ?? '';
    this.solicitanteId = s.id; // 👈 IMPORTANTE

}
  listarArticulos(): void {

    this.articuloService
      .getArticulosConCampos()
      .subscribe({

        next: (res: any) => {

          this.articulos =
            Array.isArray(res)
              ? res
              : res.data ?? [];

          console.log(
            'ARTICULOS:',
            this.articulos
          );
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
  // PARTICIPANTES
  // =========================

  agregarParticipante(): void {

    if (
      !this.nuevoParticipante.nombre.trim()
    ) {
      return;
    }

    this.participantes.push({

      nombre:
        this.nuevoParticipante.nombre,

      dni:
        this.nuevoParticipante.dni,

      codigo:
        this.nuevoParticipante.codigo,

      correo:
        this.nuevoParticipante.correo

    });

    this.nuevoParticipante = {

      nombre: '',
      dni: '',
      codigo: '',
      correo: ''

    };
  }

  eliminarParticipante(
    index: number
  ): void {

    this.participantes.splice(
      index,
      1
    );
  }

  // =========================
  // IMPRESIÓN
  // =========================

  imprimir(): void {

    window.print();
  }

  // =========================
  // LIMPIAR FORMULARIO
  // =========================

  limpiarFormulario(): void {

    this.equipo = '';

    this.destinatario = '';

    this.nombre = '';
    this.dni = '';
    this.ciclo = '';

    this.escuela = '';
    this.direccion = '';
    this.correo = '';

    this.actividad = '';

    this.lugarUso = '';

    this.detalle = '';

    this.fechaInicio = '';
    this.fechaFin = '';

    this.ciudad = '';

    this.fechaDocumento = '';

    this.participantes = [];

    this.nuevoParticipante = {

      nombre: '',
      dni: '',
      codigo: '',
      correo: ''

    };
  }

  // =========================
  // UTILIDADES
  // =========================

  obtenerFechaFormateada(): string {

    if (!this.fechaDocumento) {

      return '';
    }

    const fecha =
      new Date(this.fechaDocumento);

    return fecha.toLocaleDateString(
      'es-PE',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
  }
}

