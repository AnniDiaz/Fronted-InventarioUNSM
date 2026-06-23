import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NgxPaginationModule } from 'ngx-pagination';
import * as XLSX from 'xlsx';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ReportesService, ReporteRequest } from '../../core/services/reportes.service';
import { TipoArticuloService } from '../../core/services/tipo-articulos.service';
import { UbicacionService } from '../../core/services/ubicacion.service';

@Component({
  selector: 'app-reportes',
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    HeaderComponent,
    MatTabsModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    NgxPaginationModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  viewMode: 'visual' | 'tabla' = 'visual';
  activeTab: number = 0;
  menuAbierto: boolean = false;

  p: number = 1; // Página actual para paginación

  // Filtros
  filtroFechaInicio: Date | null = null;
  filtroFechaFin: Date | null = null;
  filtroUbicacionId: number = 0;
  filtroUbicacionOrigenId: number = 0;
  filtroUbicacionDestinoId: number = 0;
  filtroCategoriaId: number = 0;
  filtroEstado: string = 'Todos';
idsUbicacionesPermitidas: number[] = [];
  tipos: any[] = [];
  ubicaciones: any[] = [];

  // Datos recibidos
  kpis: any[] = [];
  tablaDatos: any[] = [];
  columnasTabla: string[] = [];

  chart: any;
  loading: boolean = false;
rolId: number = 0;
usuarioActual: any = null;
facultadUsuario: any = null;
ubicacionesPadre: any[] = [];
  constructor(
    private reportesService: ReportesService,
    private tipoService: TipoArticuloService,
    private ubicService: UbicacionService
  ) { }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
private obtenerUbicacionesPermitidas(): Promise<number[]> {
  return new Promise((resolve) => {

    const usuario = JSON.parse(localStorage.getItem('user') || '{}');

    const usuarioId =
      usuario?.data?.id ||
      usuario?.id ||
      usuario?.usuarioId;

    if (!usuarioId) {
      resolve([]);
      return;
    }

    this.ubicService.getUbicacionesPorUsuario(usuarioId).subscribe({
      next: (res: any) => {

        const ubicacionesUsuario = Array.isArray(res)
          ? res
          : res?.data ?? [];

        if (ubicacionesUsuario.length === 0) {
          resolve([]);
          return;
        }

        const padreId = ubicacionesUsuario[0].id;

        this.ubicService.getUbicacionesPorPadre(padreId).subscribe({
          next: (res2: any) => {

            const hijas = Array.isArray(res2)
              ? res2
              : res2?.data ?? [];

            const ids = [
              padreId,
              ...hijas.map((u: any) => Number(u.id))
            ];

            resolve(ids);
          }
        });

      }
    });

  });
}
  ngOnInit(): void {
    this.cargarTipos();
    this.cargarUbicaciones();
    this.generarReporte(); // Cargar inicial
  }

  cargarTipos() {
    this.tipoService.getTipoArticulos().subscribe((res: any) => {
      this.tipos = Array.isArray(res) ? res : res?.data ?? [];
    });
  }



  onTabChange(event: any) {
    this.activeTab = event.index;
    this.reiniciarFiltros(); // Resetear filtros al cambiar de pestaña
  }
cargarUbicaciones() {

  this.usuarioActual =
    JSON.parse(localStorage.getItem('user') || 'null');

  this.rolId = Number(localStorage.getItem('rolId'));

  if (!this.usuarioActual) return;

  const usuarioId = this.usuarioActual.data.id;

  // 👑 ADMIN: ve todo (o filtrado si quieres)
  if (this.rolId === 1) {

    this.ubicService.getUbicaciones().subscribe((res: any) => {

      const data = res?.data ?? res;
      const lista = Array.isArray(data) ? data : [];

      this.ubicaciones = lista.filter((u: any) => {
        const nombre = (u.nombre || '').toLowerCase().trim();

        return nombre.includes('facultad') ||
               nombre.includes('oficina') ||
               nombre.includes('almacén') ||
               nombre.includes('almacen');
      });

    });

    return;
  }

  // 👤 USUARIO NORMAL: solo sus ubicaciones
  this.ubicService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (res: any) => {

      if (Array.isArray(res) && res.length > 0) {

        this.facultadUsuario = res[0];
        this.ubicacionesPadre = [this.facultadUsuario];

        this.cargarSubUbicacionesReporte(this.facultadUsuario.id);

      } else {
        this.ubicaciones = [];
      }

    },
    error: () => {
      this.ubicaciones = [];
    }
  });

}
cargarSubUbicacionesReporte(padreId: number) {

  this.ubicService.getUbicacionesPorPadre(padreId).subscribe({
    next: (res: any) => {

      const data = res?.data ?? res;
      let lista = Array.isArray(data) ? data : [];

      // 🔥 OPCIONAL: agregar "Todos / Otros"
      const existeOtros = lista.some((u: any) => u.id === 100);

      if (!existeOtros) {
        lista.unshift({
          id: 100,
          nombre: 'Todos',
        });
      }

      this.ubicaciones = lista;
    }
  });

}
async generarReporte() {

  if (this.filtroFechaInicio && !this.filtroFechaFin) return;

  this.loading = true;
  this.p = 1;

  const idsPermitidos = await this.obtenerUbicacionesPermitidas();

  let ubicacionesEnviar: number[] = idsPermitidos;

  // Si el usuario seleccionó una ubicación específica
  if (
    this.filtroUbicacionId > 0 &&
    this.filtroUbicacionId !== 100
  ) {
    ubicacionesEnviar = [Number(this.filtroUbicacionId)];
  }

  const request: any = {
    tipo: this.activeTab,
    fechaInicio: this.filtroFechaInicio?.toISOString(),
    fechaFin: this.filtroFechaFin?.toISOString(),

    ubicacionIds: ubicacionesEnviar,

    ubicacionOrigenId:
      this.filtroUbicacionOrigenId > 0
        ? this.filtroUbicacionOrigenId
        : undefined,

    ubicacionDestinoId:
      this.filtroUbicacionDestinoId > 0
        ? this.filtroUbicacionDestinoId
        : undefined,

    categoriaId:
      this.filtroCategoriaId > 0
        ? this.filtroCategoriaId
        : undefined,

    estado: this.filtroEstado
  };

  console.log("ENVIANDO:", request);

  this.reportesService.generarReporte(request).subscribe({
    next: (res) => {
      this.kpis = res.kpis;
      this.tablaDatos = res.tabla;
      this.renderChart(
        res.grafico.labels,
        res.grafico.valores
      );
      this.loading = false;
    },
    error: () => {
      this.loading = false;
    }
  });
}
  renderChart(labels: string[], valores: number[]) {
    if (this.chart) this.chart.destroy();

    const ctx = document.getElementById('graficoReporte') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Métricas del Reporte',
          data: valores,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)'
          ],
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  reiniciarFiltros() {
    this.filtroFechaInicio = null;
    this.filtroFechaFin = null;
    this.filtroUbicacionId = 0;
    this.filtroUbicacionOrigenId = 0;
    this.filtroUbicacionDestinoId = 0;
    this.filtroCategoriaId = 0;
    this.filtroEstado = 'Todos';
    this.generarReporte();
  }

  descargarPDF() {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    let currentY = 20;

    // 1. Encabezado con Logos
    const logoUni = 'assets/logo_unsm.png'; // Asegúrate de que las rutas sean correctas
    const logoFacu = 'assets/logo_fisi.png';

    pdf.addImage(logoUni, 'PNG', 15, 10, 20, 20);
    pdf.addImage(logoFacu, 'PNG', pageWidth - 35, 10, 20, 20);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    const titulos = ['INVENTARIO GENERAL', 'CONTROL DE PRÉSTAMOS', 'MANTENIMIENTO', 'HISTORIAL DE TRASLADOS'];
    pdf.text(titulos[this.activeTab], pageWidth / 2, 22, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sistema de Gestión de Inventario - UNSM', pageWidth / 2, 28, { align: 'center' });

    currentY = 45;

    // 2. Leyenda de Filtros
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, currentY - 5, pageWidth - 15, currentY - 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('FILTROS APLICADOS:', 15, currentY);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    let filtrosText = `Fecha: ${this.filtroFechaInicio?.toLocaleDateString() || 'Inicio'} - ${this.filtroFechaFin?.toLocaleDateString() || 'Fin'} | `;
    filtrosText += `Estado: ${this.filtroEstado} | `;
    filtrosText += `Categoría: ${this.filtroCategoriaId > 0 ? 'Filtrada' : 'Todas'}`;

    pdf.text(filtrosText, 15, currentY + 5);
    currentY += 15;

    // 3. Captura de KPIs, Gráfico y Tabla
    const kpiElement = document.querySelector('.kpi-grid') as HTMLElement;
    const chartElement = document.querySelector('.visual-container') as HTMLElement;
    const tableElement = document.getElementById('tablaCompletaPDF') as HTMLElement;

    const captureAndAdd = async (el: HTMLElement, y: number, width: number) => {
      if (!el) return y;

      // Guardar estado original de visibilidad
      const wasHidden = el.parentElement?.hasAttribute('hidden') || el.hasAttribute('hidden');
      if (wasHidden) {
        if (el.parentElement) el.parentElement.removeAttribute('hidden');
        el.removeAttribute('hidden');
      }

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      // Restaurar estado original
      if (wasHidden && el.parentElement) {
        el.parentElement.setAttribute('hidden', 'true');
      }

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * width) / canvas.width;

      // Verificar si cabe en la página
      if (y + imgHeight > 280) {
        pdf.addPage();
        y = 20;
      }

      pdf.addImage(imgData, 'PNG', (pageWidth - width) / 2, y, width, imgHeight);
      return y + imgHeight + 10;
    };

    const runExport = async () => {
      currentY = await captureAndAdd(kpiElement, currentY, 180);

      if (this.viewMode === 'visual') {
        currentY = await captureAndAdd(chartElement, currentY, 160);
      }

      currentY = await captureAndAdd(tableElement, currentY, 180);

      pdf.save(`Reporte_${titulos[this.activeTab].replace(' ', '_')}_${new Date().getTime()}.pdf`);
    };

    runExport();
  }

  exportarExcel() {
    if (this.tablaDatos.length === 0) return;

    // 1. Crear la hoja de trabajo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.tablaDatos);

    // 2. Crear el libro
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // 3. Descargar
    const nombres = ['Inventario', 'Prestamos', 'Mantenimiento', 'Traslados'];
    XLSX.writeFile(wb, `Reporte_${nombres[this.activeTab]}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}
