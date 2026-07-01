import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { ReportesService } from '../../../core/services/reportes.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { ArticuloService } from '../../../core/services/articulos.service';
import { TrasladosService } from '../../../core/services/traslados.service';
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
ubicacionesHijasFiltradas: any[] = [];
  categorias: any[] = [];
  articulos: any[] = [];
idsUbicacionesPermitidas: number[] = [];
  barChart: any;
  pieChart: any;
ubicacionId?: number;
  constructor(
    private reportesService: ReportesService,
    private ubicacionService: UbicacionService,
      private articuloService: ArticuloService,
      private trasladoService: TrasladosService

  ) { }

ngOnInit() {
  this.obtenerUbicacionesPermitidas().then((idsPermitidos) => {
    this.idsUbicacionesPermitidas = idsPermitidos;

    this.cargarDatosDashboard(idsPermitidos);
    this.cargarTotalArticulosPorUbicacion(idsPermitidos);
    this.totalUbicaciones = idsPermitidos.length;
    this.cargarTotalTrasladosFiltrados(idsPermitidos);
  });
}

// Ubicaciones permitidas para el usuario logueado: prioriza las ubicaciones
// de su escuela (más confiable) y solo recurre al árbol padre/hijos por
// usuario si no hay escuela asignada en localStorage.
private obtenerUbicacionesPermitidas(): Promise<number[]> {
  return new Promise((resolve) => {

    const escuelaId = Number(localStorage.getItem('escuelaId'));

    if (escuelaId) {
      this.ubicacionService.getUbicacionesPorEscuela(escuelaId).subscribe({
        next: (res: any) => {
          const ubicacionesEscuela = Array.isArray(res) ? res : res?.data ?? [];
          resolve(ubicacionesEscuela.map((u: any) => Number(u.id)));
        },
        error: () => resolve([])
      });
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('user') || '{}');

    const usuarioId =
      usuario?.data?.id ||
      usuario?.id ||
      usuario?.usuarioId;

    if (!usuarioId) {
      resolve([]);
      return;
    }

    this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
      next: (res: any) => {

        const ubicacionesUsuario = Array.isArray(res) ? res : res?.data ?? [];

        if (ubicacionesUsuario.length === 0) {
          resolve([]);
          return;
        }

        const padreId = ubicacionesUsuario[0].id;

        this.ubicacionService.getUbicacionesPorPadre(padreId).subscribe({
          next: (res2: any) => {

            const ubicacionesHijas = Array.isArray(res2) ? res2 : res2?.data ?? [];

            resolve([
              padreId,
              ...ubicacionesHijas.map((u: any) => Number(u.id))
            ]);
          },
          error: () => resolve([padreId])
        });
      },
      error: () => resolve([])
    });
  });
}

cargarTotalArticulosPorUbicacion(idsPermitidos: number[]) {
  this.articuloService.getArticulosConCampos().subscribe({
    next: (res3: any) => {

      const data = Array.isArray(res3) ? res3 : res3?.data ?? [];

      const filtrados = data.filter((a: any) =>
        idsPermitidos.includes(Number(a.ubicacionId))
      );

      this.totalArticulos = filtrados.length;
    }
  });
}

cargarTotalTrasladosFiltrados(idsPermitidos: number[]) {
  this.trasladoService.getTraslados().subscribe({
    next: (resp: any) => {

      const data = Array.isArray(resp) ? resp : resp?.data ?? [];

      const filtrados = data.filter((t: any) =>
        idsPermitidos.includes(Number(t.ubicacionOrigenId)) ||
        idsPermitidos.includes(Number(t.ubicacionDestinoId))
      );

      this.totalTraslados = filtrados.length;
    }
  });
}

cargarDatosDashboard(idsPermitidos: number[]) {

  const request: any = {
    tipo: 0,
    ubicacionIds: idsPermitidos
  };

  this.reportesService.generarReporte(request).subscribe(res => {

    const kpiActivos = res.kpis.find(k => k.label === 'TOTAL ACTIVOS');
    const kpiValor = res.kpis.find(k => k.label === 'VALORACIÓN TOTAL');

    this.totalArticulos = kpiActivos ? parseInt(kpiActivos.value) : 0;
    this.totalValor = kpiValor ? parseFloat(kpiValor.value.replace('S/ ', '').replace(',', '')) : 0;

    this.articulos = res.tabla.slice(0, 4).map(a => ({
      codigo: a.codigo,
      nombre: a.nombreArticulo,
      categoria: a.categoria,
      ubicacion: a.ubicacion,
      estado: a.estado?.toLowerCase() || 'nuevo',
      fecha: a.fecha
    }));

    this.inicializarBarChart(res.tabla);
    this.inicializarPieChart(res.tabla);
  });
}
async inicializarBarChart(data: any[]) {

  const ubicacionesCounts = data.reduce((acc: any, curr: any) => {

    const ubicacion = curr.ubicacion;

    if (!ubicacion) return acc;

    acc[ubicacion] = (acc[ubicacion] || 0) + 1;

    return acc;
  }, {});

  const labels = Object.keys(ubicacionesCounts);
  const valores = Object.values(ubicacionesCounts);

  if (this.barChart) this.barChart.destroy();

  this.barChart = new Chart('barChart', {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: '#10b981',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true }
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
