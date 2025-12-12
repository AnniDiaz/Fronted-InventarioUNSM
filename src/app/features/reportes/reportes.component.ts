import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ReportesService } from '../../core/services/reportes.service';

@Component({
  selector: 'app-reportes',
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent {
  reporteSeleccionado: string = '';

  mostrarGrafico = false;
  mostrarTabla = false;

  columna1 = '';
  columna2 = '';

  tablaDatos: any[] = [];

  chart: any;

  constructor(private reportesService: ReportesService) {}

  generarReporte() {
    if (!this.reporteSeleccionado) return;

    if (this.chart) this.chart.destroy();

    if (this.reporteSeleccionado === 'articulos-ubicacion') {
      this.cargarArticulosPorUbicacion();
    } else if (this.reporteSeleccionado === 'articulos-tipo') {
      this.cargarArticulosPorTipo();
    }
  }

  cargarArticulosPorUbicacion() {
    this.reportesService.getArticulosPorUbicacion().subscribe(data => {
      const labels = data.map((d: any) => d.ubicacion);
      const valores = data.map((d: any) => d.cantidad);

      this.tablaDatos = data.map((d: any) => ({
        label: d.ubicacion,
        valor: d.cantidad
      }));

      this.columna1 = "Ubicación";
      this.columna2 = "Cantidad";

      this.renderChart(labels, valores);
    });
  }

  cargarArticulosPorTipo() {
    this.reportesService.getArticulosPorTipo().subscribe(data => {
      const labels = data.map((d: any) => d.tipo);
      const valores = data.map((d: any) => d.cantidad);

      this.tablaDatos = data.map((d: any) => ({
        label: d.tipo,
        valor: d.cantidad
      }));

      this.columna1 = "Tipo de Artículo";
      this.columna2 = "Cantidad";

      this.renderChart(labels, valores);
    });
  }

  renderChart(labels: any[], valores: any[]) {
    this.mostrarGrafico = true;
    this.mostrarTabla = true;

    const ctx = document.getElementById('graficoReporte') as HTMLCanvasElement;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Cantidad',
          data: valores,
          backgroundColor: '#28a745cc',
          borderColor: '#1e7e34',
          borderWidth: 2
        }]
      }
    });
  }

  descargarPDF() {
  const grafico: any = document.getElementById('graficoReporte');
  const tabla: any = document.querySelector('.tabla-reportes');

  if (!grafico || !tabla) return;

  html2canvas(grafico).then(canvasGrafico => {

    html2canvas(tabla).then(canvasTabla => {

      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      const fullWidth = pageWidth - margin * 2;

      // Logos
      const logoUni = '/assets/logo_unsm.png';
      const logoFacu = '/assets/logo_fisi.png';

      // Header
      pdf.addImage(logoUni, 'PNG', margin, 10, 25, 25);  
      pdf.addImage(logoFacu, 'PNG', pageWidth - margin - 25, 10, 25, 25); 

      // Título
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('Reporte del Sistema de Inventario', pageWidth / 2, 25, { align: 'center' });

      // --- Insertar gráfico ---
      const imgGraficoData = canvasGrafico.toDataURL('image/png');
      const graficoHeight = (canvasGrafico.height * fullWidth) / canvasGrafico.width;

      let y = 45; 
      pdf.addImage(imgGraficoData, 'PNG', margin, y, fullWidth, graficoHeight);

      // --- Insertar tabla ---
      y += graficoHeight + 10;

      const imgTablaData = canvasTabla.toDataURL('image/png');
      const tablaHeight = (canvasTabla.height * fullWidth) / canvasTabla.width;

      if (y + tablaHeight > pdf.internal.pageSize.getHeight() - 15) {
        pdf.addPage();
        y = 20;
      }

      pdf.addImage(imgTablaData, 'PNG', margin, y, fullWidth, tablaHeight);

      pdf.save('reporte.pdf');
    });
  });
}
}
