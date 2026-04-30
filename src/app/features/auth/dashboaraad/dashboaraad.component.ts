import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ReportesService, ReporteRequest } from '../../../core/services/reportes.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';

const centerTextPlugin: any = {
  id: 'centerText',
  beforeDraw: function (chart: any) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const width = chartArea.right - chartArea.left;
    const height = chartArea.bottom - chartArea.top;
    const centerX = chartArea.left + width / 2;
    const centerY = chartArea.top + height / 2;

    ctx.restore();

    // Configs for text
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.75; // Based on cutout: '75%'

    const fontSizeMain = Math.max(14, Math.round(innerRadius * 0.5));
    const fontSizeSub = Math.max(9, Math.round(innerRadius * 0.2));

    // Draw 100%
    ctx.font = `bold ${fontSizeMain}px Inter, sans-serif`;
    ctx.fillStyle = '#111827';
    ctx.fillText("100%", centerX, centerY - (fontSizeMain * 0.1));

    // Draw TOTAL
    ctx.font = `bold ${fontSizeSub}px Inter, sans-serif`;
    ctx.fillStyle = '#6b7280';
    ctx.fillText("TOTAL", centerX, centerY + (fontSizeMain * 0.5) + 2);

    ctx.save();
  }
};

@Component({
  selector: 'app-dashboaraad',
  imports: [SidebarComponent, HeaderComponent, CommonModule],
  templateUrl: './dashboaraad.component.html',
  styleUrls: ['./dashboaraad.component.css']
})
export class DashboardComponent implements OnInit {

  menuAbierto = false;

  totalArticulos = 0;
  totalUbicaciones = 0;
  totalTraslados = 0;
  totalValor = 0;

  categorias: any[] = [];
  articulos: any[] = [];

  barChart: any;
  pieChart: any;

  constructor(
    private reportesService: ReportesService,
    private ubicacionService: UbicacionService
  ) { }

  ngOnInit() {
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    // 1. Obtener datos de Inventario General
    this.reportesService.generarReporte({ tipo: 0 }).subscribe(res => {
      // KPIs
      const kpiActivos = res.kpis.find(k => k.label === 'TOTAL ACTIVOS');
      const kpiValor = res.kpis.find(k => k.label === 'VALORACIÓN TOTAL');

      this.totalArticulos = kpiActivos ? parseInt(kpiActivos.value) : 0;
      this.totalValor = kpiValor ? parseFloat(kpiValor.value.replace('S/ ', '').replace(',', '')) : 0;

      // Tabla de Artículos Recientes
      this.articulos = res.tabla.slice(0, 4).map(a => ({
        codigo: a.codigo,
        nombre: a.nombreArticulo,
        categoria: a.categoria,
        ubicacion: a.ubicacion,
        estado: a.estado?.toLowerCase() || 'nuevo',
        fecha: a.fecha
      }));

      // Procesar datos para Gráfico de Barras (Por Ubicación)
      this.inicializarBarChart(res.tabla);

      // Procesar datos para Gráfico de Dona (Por Categoría)
      this.inicializarPieChart(res.tabla);
    });

    // 2. Obtener Total de Ubicaciones
    this.ubicacionService.getUbicaciones().subscribe((res: any) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      this.totalUbicaciones = data.length;
    });

    // 3. Obtener Traslados Realizados
    this.reportesService.generarReporte({ tipo: 3 }).subscribe(res => {
      const kpiTraslados = res.kpis.find(k => k.label === 'TRASLADOS REALIZADOS');
      this.totalTraslados = kpiTraslados ? parseInt(kpiTraslados.value) : 0;
    });
  }

  inicializarBarChart(data: any[]) {
    const ubicacionesCounts = data.reduce((acc: any, curr: any) => {
      acc[curr.ubicacion] = (acc[curr.ubicacion] || 0) + 1;
      return acc;
    }, {});

    const labels = Object.keys(ubicacionesCounts);
    const valores = Object.values(ubicacionesCounts);

    if (this.barChart) this.barChart.destroy();

    this.barChart = new Chart('barChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: '#10b981',
          barPercentage: 0.6,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  inicializarPieChart(data: any[]) {
    const catCounts = data.reduce((acc: any, curr: any) => {
      const cat = curr.categoria || 'Sin Categoría';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const total = data.length;

    this.categorias = Object.keys(catCounts).map((key, index) => ({
      nombre: key,
      valor: Math.round((catCounts[key] / total) * 100),
      color: colors[index % colors.length]
    }));

    if (this.pieChart) this.pieChart.destroy();

    this.pieChart = new Chart('pieChart', {
      type: 'doughnut',
      plugins: [centerTextPlugin],
      data: {
        labels: this.categorias.map(c => c.nombre),
        datasets: [{
          data: this.categorias.map(c => c.valor),
          backgroundColor: this.categorias.map(c => c.color),
          borderWidth: 0
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
}
