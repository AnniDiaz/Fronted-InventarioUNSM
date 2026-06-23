import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HeaderComponent } from "../shared/components/header/header.component";
import { SidebarComponent } from "../shared/components/sidebar/sidebar.component";
import { UbicacionService } from '../core/services/ubicacion.service';
import { ArticuloService } from '../core/services/articulos.service';
import { MantenimientoService } from '../core/services/mantenimiento.service';
import { SedeService } from '../core/services/sede.service';
import { FacultadService } from '../core/services/facultad.service';
import { EscuelaService } from '../core/services/escuela.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import Chart from 'chart.js/auto';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {

  menuAbierto = false;

  // Banner
  sedeActualNombre = 'Sede Principal';
  conexionSegura = false;

  // KPIs
  totalBienes = 0;
  valorTotalAprox = 0;
  bienesOperativos = 0;
  porcentajeOperativos = 0;
  bienesMantenimiento = 0;
  diasPromedioMantenimiento = 0;
  bienesBaja = 0;

  // Crecimiento patrimonial
  modoCrecimiento: 'mensual' | 'anual' = 'mensual';
  private crecimientoMensual: { labels: string[]; valores: number[] } = { labels: [], valores: [] };
  private crecimientoAnual: { labels: string[]; valores: number[] } = { labels: [], valores: [] };
  private chartCrecimiento: any;

  // Carga por sede
  cargaPorSede: { nombre: string; cantidad: number }[] = [];
  private chartCargaSede: any;

  // Composición
  composicion: { nombre: string; cantidad: number; color: string }[] = [];
  porcentajeDisponible = 0;
  private chartComposicion: any;

  // Incidencias (mantenimientos recientes)
  incidencias: { titulo: string; detalle: string; tiempo: string }[] = [];

  private articulos: any[] = [];
  private mantenimientos: any[] = [];
  private ubicaciones: any[] = [];
  private escuelas: any[] = [];
  private facultades: any[] = [];
  private sedes: any[] = [];

  private mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  constructor(
    private ubicacionService: UbicacionService,
    private articuloService: ArticuloService,
    private mantenimientoService: MantenimientoService,
    private sedeService: SedeService,
    private facultadService: FacultadService,
    private escuelaService: EscuelaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.conexionSegura = typeof window !== 'undefined' && window.location.protocol === 'https:';
    this.cargarDatos();
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  private aArray(res: any): any[] {
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
  }

  cargarDatos() {
    forkJoin({
      articulos: this.articuloService.getArticulosConCampos().pipe(catchError(() => of([]))),
      mantenimientos: this.mantenimientoService.getMantenimientos().pipe(catchError(() => of([]))),
      sedes: this.sedeService.getSedes().pipe(catchError(() => of([]))),
      facultades: this.facultadService.getFacultades().pipe(catchError(() => of([]))),
      escuelas: this.escuelaService.getEscuelas().pipe(catchError(() => of([]))),
      ubicaciones: this.ubicacionService.getUbicaciones().pipe(catchError(() => of([])))
    }).subscribe(({ articulos, mantenimientos, sedes, facultades, escuelas, ubicaciones }: any) => {
      this.articulos = this.aArray(articulos);
      this.mantenimientos = this.aArray(mantenimientos);
      this.sedes = this.aArray(sedes);
      this.facultades = this.aArray(facultades);
      this.escuelas = this.aArray(escuelas);
      this.ubicaciones = this.aArray(ubicaciones);

      this.sedeActualNombre = this.sedes[0]?.nombre || 'Sede Principal';

      this.calcularKpis();
      this.calcularCrecimiento();
      this.calcularCargaPorSede();
      this.calcularComposicion();
      this.calcularIncidencias();

      setTimeout(() => this.renderGraficos());
    });
  }

  private calcularKpis() {
    const idsEnMantenimiento = new Set(
      this.mantenimientos
        .filter((m: any) => m.estadoMantenimiento === true)
        .map((m: any) => Number(m.articuloId))
    );

    this.totalBienes = this.articulos.length;
    this.bienesMantenimiento = idsEnMantenimiento.size;
    this.bienesBaja = this.articulos.filter((a: any) => Number(a.estado) === 0).length;
    this.bienesOperativos = Math.max(this.totalBienes - this.bienesMantenimiento - this.bienesBaja, 0);
    this.porcentajeOperativos = this.totalBienes ? Math.round((this.bienesOperativos / this.totalBienes) * 100) : 0;

    this.valorTotalAprox = this.articulos.reduce((suma: number, a: any) => suma + (Number(a.valorAdquisitivo) || 0), 0);

    const activos = this.mantenimientos.filter((m: any) => m.estadoMantenimiento === true && m.fechaMantenimiento);
    if (activos.length) {
      const ahora = Date.now();
      const totalDias = activos.reduce((suma: number, m: any) => {
        const dias = (ahora - new Date(m.fechaMantenimiento).getTime()) / (1000 * 60 * 60 * 24);
        return suma + Math.max(dias, 0);
      }, 0);
      this.diasPromedioMantenimiento = Math.round((totalDias / activos.length) * 10) / 10;
    } else {
      this.diasPromedioMantenimiento = 0;
    }
  }

  get valorTotalFormateado(): string {
    const valor = this.valorTotalAprox;
    if (valor >= 1_000_000) return `S/. ${(valor / 1_000_000).toFixed(1)}M`;
    if (valor >= 1_000) return `S/. ${(valor / 1_000).toFixed(1)}K`;
    return `S/. ${valor.toFixed(0)}`;
  }

  private calcularCrecimiento() {
    const ahora = new Date();

    const mesesLabels: string[] = [];
    const mesesValores: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      const limite = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);
      mesesLabels.push(this.mesesNombres[fecha.getMonth()]);
      mesesValores.push(this.articulos.filter((a: any) => a.fechaAdquision && new Date(a.fechaAdquision) < limite).length);
    }
    this.crecimientoMensual = { labels: mesesLabels, valores: mesesValores };

    const anioActual = ahora.getFullYear();
    const aniosLabels: string[] = [];
    const aniosValores: number[] = [];
    for (let i = 4; i >= 0; i--) {
      const anio = anioActual - i;
      const limite = new Date(anio + 1, 0, 1);
      aniosLabels.push(String(anio));
      aniosValores.push(this.articulos.filter((a: any) => a.fechaAdquision && new Date(a.fechaAdquision) < limite).length);
    }
    this.crecimientoAnual = { labels: aniosLabels, valores: aniosValores };
  }

  cambiarModoCrecimiento(modo: 'mensual' | 'anual') {
    if (this.modoCrecimiento === modo) return;
    this.modoCrecimiento = modo;
    this.renderChartCrecimiento();
  }

  private calcularCargaPorSede() {
    const conteoPorSede = new Map<number, number>();

    this.articulos.forEach((a: any) => {
      const ubicacion = this.ubicaciones.find((u: any) => u.id === a.ubicacionId);
      const escuela = ubicacion ? this.escuelas.find((e: any) => e.id === ubicacion.escuelaId) : null;
      const facultad = escuela ? this.facultades.find((f: any) => f.id === escuela.facultadId) : null;
      const sedeId = facultad?.sedeId;

      if (sedeId == null) return;
      conteoPorSede.set(sedeId, (conteoPorSede.get(sedeId) || 0) + 1);
    });

    this.cargaPorSede = this.sedes
      .map((s: any) => ({ nombre: s.nombre, cantidad: conteoPorSede.get(s.id) || 0 }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }

  private calcularComposicion() {
    const colores: Record<string, string> = {
      nuevo: '#10b981',
      bueno: '#3b82f6',
      regular: '#f59e0b',
      malo: '#ef4444'
    };

    const conteo: Record<string, number> = {};
    this.articulos.forEach((a: any) => {
      const key = (a.condicion || 'sin dato').toLowerCase();
      conteo[key] = (conteo[key] || 0) + 1;
    });

    this.composicion = Object.keys(conteo).map(key => ({
      nombre: key.charAt(0).toUpperCase() + key.slice(1),
      cantidad: conteo[key],
      color: colores[key] || '#8b5cf6'
    }));

    const disponibles = (conteo['nuevo'] || 0) + (conteo['bueno'] || 0);
    this.porcentajeDisponible = this.totalBienes ? Math.round((disponibles / this.totalBienes) * 100) : 0;
  }

  private calcularIncidencias() {
    this.incidencias = [...this.mantenimientos]
      .filter((m: any) => m.fechaMantenimiento)
      .sort((a: any, b: any) => new Date(b.fechaMantenimiento).getTime() - new Date(a.fechaMantenimiento).getTime())
      .slice(0, 3)
      .map((m: any) => {
        const articulo = this.articulos.find((a: any) => a.id === m.articuloId);
        const ubicacion = articulo ? this.ubicaciones.find((u: any) => u.id === articulo.ubicacionId) : null;

        return {
          titulo: 'Solicitud de Mantenimiento',
          detalle: ubicacion?.nombre || articulo?.nombre || 'Sin ubicación',
          tiempo: this.tiempoRelativo(m.fechaMantenimiento)
        };
      });
  }

  private tiempoRelativo(fechaIso: string): string {
    const diffMs = Math.max(Date.now() - new Date(fechaIso).getTime(), 0);
    const minutos = Math.floor(diffMs / 60000);

    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} min`;

    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `Hace ${horas} h`;

    const dias = Math.floor(horas / 24);
    return `Hace ${dias} d`;
  }

  private renderGraficos() {
    this.renderChartCrecimiento();
    this.renderChartCargaSede();
    this.renderChartComposicion();
  }

  private renderChartCrecimiento() {
    const datos = this.modoCrecimiento === 'mensual' ? this.crecimientoMensual : this.crecimientoAnual;

    if (this.chartCrecimiento) this.chartCrecimiento.destroy();

    const canvas = document.getElementById('chartCrecimientoPatrimonial') as HTMLCanvasElement;
    if (!canvas) return;

    this.chartCrecimiento = new Chart(canvas, {
      type: 'line',
      data: {
        labels: datos.labels,
        datasets: [{
          data: datos.valores,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private renderChartCargaSede() {
    if (this.chartCargaSede) this.chartCargaSede.destroy();

    const canvas = document.getElementById('chartCargaPorSede') as HTMLCanvasElement;
    if (!canvas) return;

    this.chartCargaSede = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.cargaPorSede.map(s => s.nombre),
        datasets: [{
          data: this.cargaPorSede.map(s => s.cantidad),
          backgroundColor: '#0f5132',
          borderRadius: 6,
          barThickness: 22
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  private renderChartComposicion() {
    if (this.chartComposicion) this.chartComposicion.destroy();

    const canvas = document.getElementById('chartComposicion') as HTMLCanvasElement;
    if (!canvas) return;

    const porcentaje = this.porcentajeDisponible;

    const centerTextPlugin = {
      id: 'centerTextComposicion',
      beforeDraw: (chart: any) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillStyle = '#111827';
        ctx.fillText(`${porcentaje}%`, centerX, centerY - 8);

        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('DISPONIBLE', centerX, centerY + 12);

        ctx.restore();
      }
    };

    this.chartComposicion = new Chart(canvas, {
      type: 'doughnut',
      plugins: [centerTextPlugin],
      data: {
        labels: this.composicion.map(c => c.nombre),
        datasets: [{
          data: this.composicion.map(c => c.cantidad),
          backgroundColor: this.composicion.map(c => c.color),
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

  // Acciones OTI
  registrarBien() {
    this.router.navigate(['/articulos']);
  }

  generarReportePDF() {
    this.router.navigate(['/reportes']);
  }

  verTrasladosPendientes() {
    this.router.navigate(['/traslados']);
  }

  auditarPatrimonio() {
    Swal.fire('Próximamente', 'El módulo de auditoría de patrimonio estará disponible pronto.', 'info');
  }

  verTodasLasAlertas() {
    this.router.navigate(['/mantenimiento']);
  }
}
