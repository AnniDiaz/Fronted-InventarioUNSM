import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reportes',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})

export class ReportesComponent implements OnInit {

  tiposReportes = [
    { id: 'ubicacion', nombre: 'Bienes por Ubicación' },
    { id: 'responsable', nombre: 'Bienes por Responsable' },
    { id: 'movimientos', nombre: 'Movimientos de Inventario' }
  ];

  tipoSeleccionado: string = '';

  filtros: any = {
    ubicacion: '',
    responsable: '',
    fechaInicio: '',
    fechaFin: ''
  };

  resultados: any[] = [];

  objectKeys = Object.keys;

  constructor() {}

  ngOnInit(): void {}

  generarReporte(): void {
    this.resultados = []; 

    if (!this.tipoSeleccionado) {
      alert('Por favor, seleccione un tipo de reporte.');
      return;
    }

    switch (this.tipoSeleccionado) {
      case 'ubicacion':
        this.resultados = [
          { codigo: 'LAB-001', nombre: 'CPU Dell Optiplex', categoria: 'Equipo', estado: 'Operativo', ubicacion: this.filtros.ubicacion || 'Laboratorio Redes' },
          { codigo: 'LAB-002', nombre: 'Monitor HP', categoria: 'Periférico', estado: 'En reparación', ubicacion: this.filtros.ubicacion || 'Laboratorio Redes' }
        ];
        break;

      case 'responsable':
        this.resultados = [
          { codigo: 'OF-001', nombre: 'Laptop Lenovo', categoria: 'Portátil', estado: 'Operativo', responsable: this.filtros.responsable || 'Ing. Pérez' },
          { codigo: 'OF-002', nombre: 'Proyector Epson', categoria: 'Multimedia', estado: 'Operativo', responsable: this.filtros.responsable || 'Ing. Pérez' }
        ];
        break;

      case 'movimientos':
        this.resultados = [
          { codigo: 'M-001', tipo: 'Alta', fecha: this.filtros.fechaInicio || '2025-01-15', descripcion: 'Ingreso nuevo equipo de cómputo' },
          { codigo: 'M-002', tipo: 'Traslado', fecha: this.filtros.fechaFin || '2025-02-20', descripcion: 'Equipo trasladado a laboratorio de Redes' }
        ];
        break;

      default:
        this.resultados = [];
        break;
    }
    if (this.resultados.length === 0) {
      alert('No se encontraron resultados para los filtros aplicados.');
    }
  }

  limpiarFiltros(): void {
    this.filtros = {
      ubicacion: '',
      responsable: '',
      fechaInicio: '',
      fechaFin: ''
    };
    this.tipoSeleccionado = '';
    this.resultados = [];
  }

  // --- Exportar funciones (a completar luego) ---
  exportarPDF(): void {
    alert('Función de exportar a PDF próximamente disponible.');
  }

  exportarExcel(): void {
    alert('Función de exportar a Excel próximamente disponible.');
  }

  imprimirReporte(): void {
    window.print();
  }
}