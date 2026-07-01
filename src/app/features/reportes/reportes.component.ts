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
import * as XLSX from 'xlsx-js-style';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ReportesService } from '../../core/services/reportes.service';
import { lastValueFrom } from 'rxjs';
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

    const escuelaId = Number(localStorage.getItem('escuelaId'));

    // Prioridad: ubicaciones de la escuela del usuario logueado.
    // (getUbicacionesPorUsuario filtra por el dueño original de la
    // ubicación, que no siempre coincide con el usuario actual)
    if (escuelaId) {
      this.ubicService.getUbicacionesPorEscuela(escuelaId).subscribe({
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
          },
          error: () => resolve([padreId])
        });

      },
      error: () => resolve([])
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

  this.usuarioActual = JSON.parse(localStorage.getItem('user') || 'null');
  this.rolId = Number(localStorage.getItem('rolId'));

  if (!this.usuarioActual) return;

  const usuarioId = this.usuarioActual.data.id;

  if (this.rolId === 1) {
    this.ubicService.getUbicaciones().subscribe((res: any) => {
      const data = res?.data ?? res;
      this.ubicaciones = Array.isArray(data) ? data : [];
    });
    return;
  }

  const escuelaId = Number(localStorage.getItem('escuelaId'));

  if (escuelaId) {
    this.ubicService.getUbicacionesPorEscuela(escuelaId).subscribe({
      next: (res: any) => {
        this.ubicaciones = Array.isArray(res) ? res : res?.data ?? [];
      },
      error: () => { this.ubicaciones = []; }
    });
    return;
  }

  // fallback: flujo antiguo por usuario
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
    error: () => { this.ubicaciones = []; }
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
  this.idsUbicacionesPermitidas = idsPermitidos;

  const escuelaId = Number(localStorage.getItem('escuelaId'));
  if (escuelaId && idsPermitidos.length === 0) {
    // Escuela asignada sin ubicaciones: mostrar vacío sin consultar el backend
    this.kpis = [];
    this.tablaDatos = [];
    this.renderChart([], []);
    this.loading = false;
    return;
  }

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

  private readonly ESTILOS: any = {
    titulo: {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: '0d3d22' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    },
    reporte: {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: '1d6f42' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    meta: {
      font: { italic: true, color: { rgb: '64748b' }, sz: 9 },
      fill: { patternType: 'solid', fgColor: { rgb: 'f1f5f9' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    },
    encabezado: {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
      fill: { patternType: 'solid', fgColor: { rgb: '2d8a5a' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top:    { style: 'medium', color: { rgb: '0d3d22' } },
        bottom: { style: 'medium', color: { rgb: '0d3d22' } },
        left:   { style: 'thin',   color: { rgb: '52b788' } },
        right:  { style: 'thin',   color: { rgb: '52b788' } }
      }
    },
    datoPar: {
      font: { sz: 10, color: { rgb: '1e293b' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'f0fdf4' } },
      alignment: { vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'd1fae5' } }, bottom: { style: 'thin', color: { rgb: 'd1fae5' } },
        left: { style: 'thin', color: { rgb: 'd1fae5' } }, right: { style: 'thin', color: { rgb: 'd1fae5' } }
      }
    },
    datoImpar: {
      font: { sz: 10, color: { rgb: '1e293b' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: 'e2e8f0' } }, bottom: { style: 'thin', color: { rgb: 'e2e8f0' } },
        left: { style: 'thin', color: { rgb: 'e2e8f0' } }, right: { style: 'thin', color: { rgb: 'e2e8f0' } }
      }
    },
    numeroPar: {
      font: { sz: 10, color: { rgb: '155130' }, bold: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'f0fdf4' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'd1fae5' } }, bottom: { style: 'thin', color: { rgb: 'd1fae5' } },
        left: { style: 'thin', color: { rgb: 'd1fae5' } }, right: { style: 'thin', color: { rgb: 'd1fae5' } }
      }
    },
    numeroImpar: {
      font: { sz: 10, color: { rgb: '155130' }, bold: true },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'right', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'e2e8f0' } }, bottom: { style: 'thin', color: { rgb: 'e2e8f0' } },
        left: { style: 'thin', color: { rgb: 'e2e8f0' } }, right: { style: 'thin', color: { rgb: 'e2e8f0' } }
      }
    },
    nroPar: {
      font: { sz: 9, color: { rgb: '94a3b8' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'f0fdf4' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'd1fae5' } }, bottom: { style: 'thin', color: { rgb: 'd1fae5' } },
        left: { style: 'thin', color: { rgb: 'd1fae5' } }, right: { style: 'thin', color: { rgb: 'd1fae5' } }
      }
    },
    nroImpar: {
      font: { sz: 9, color: { rgb: '94a3b8' } },
      fill: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'e2e8f0' } }, bottom: { style: 'thin', color: { rgb: 'e2e8f0' } },
        left: { style: 'thin', color: { rgb: 'e2e8f0' } }, right: { style: 'thin', color: { rgb: 'e2e8f0' } }
      }
    }
  };

  private styleRange(ws: any, r1: number, r2: number, c1: number, c2: number, style: any): void {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) ws[ref] = { v: '', t: 's' };
        ws[ref].s = style;
      }
    }
  }

  private excelConfig: Record<number, { titulo: string; hoja: string; headers: string[]; colsNumericas: number[]; mapper: (item: any, i: number) => any[] }> = {
    0: {
      titulo: 'INVENTARIO GENERAL',
      hoja: 'Inventario',
      headers: ['N°', 'ARTÍCULO', 'CÓDIGO PATRIMONIAL', 'UBICACIÓN', 'ESTADO', 'VALOR (S/)'],
      colsNumericas: [5],
      mapper: (item, i) => [i + 1, item.nombreArticulo ?? '', item.codigoPatrimonial ?? '', item.ubicacion ?? '', item.estado ?? '', item.valor ?? 0]
    },
    1: {
      titulo: 'CONTROL DE PRÉSTAMOS',
      hoja: 'Préstamos',
      headers: ['N°', 'ARTÍCULO', 'SOLICITANTE', 'FECHA PRÉSTAMO', 'FECHA DEVOLUCIÓN', 'ESTADO'],
      colsNumericas: [],
      mapper: (item, i) => [i + 1, item.nombreArticulo ?? '', item.solicitante ?? '', item.fecha ?? '', item.fechaDevolucion ?? '', item.estado ?? '']
    },
    2: {
      titulo: 'MANTENIMIENTO',
      hoja: 'Mantenimiento',
      headers: ['N°', 'ARTÍCULO', 'TIPO', 'PROVEEDOR', 'FECHA', 'COSTO (S/)', 'ESTADO'],
      colsNumericas: [5],
      mapper: (item, i) => [i + 1, item.nombreArticulo ?? '', item.tipoMantenimiento ?? '', item.proveedor ?? '', item.fecha ?? '', item.costo ?? 0, item.estado ?? '']
    },
    3: {
      titulo: 'HISTORIAL DE TRASLADOS',
      hoja: 'Traslados',
      headers: ['N°', 'ARTÍCULO', 'UBICACIÓN ORIGEN', 'UBICACIÓN DESTINO', 'FECHA TRASLADO', 'OBSERVACIONES'],
      colsNumericas: [],
      mapper: (item, i) => [i + 1, item.nombreArticulo ?? '', item.origen ?? '', item.destino ?? '', item.fecha ?? '', item.observaciones ?? '']
    }
  };

  private buildHojaIndicadores(titulo: string, kpis: any[]): XLSX.WorkSheet {
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora = new Date().toLocaleTimeString('es-PE');
    const E = this.ESTILOS;

    const filtroRows: any[][] = [
      ['Fecha inicio', this.filtroFechaInicio?.toLocaleDateString('es-PE') ?? 'Sin filtro'],
      ['Fecha fin',    this.filtroFechaFin?.toLocaleDateString('es-PE') ?? 'Sin filtro'],
      ['Estado',       this.filtroEstado ?? 'Todos'],
      ['Categoría',    this.filtroCategoriaId > 0 ? `ID ${this.filtroCategoriaId}` : 'Todas']
    ];

    const rows: any[][] = [
      ['UNIVERSIDAD NACIONAL DE SAN MARTÍN - SISTEMA DE INVENTARIO'],
      [`INDICADORES: ${titulo}`],
      [`Generado el: ${fecha} a las ${hora}`],
      [],
      ['INDICADOR', 'VALOR'],
      ...kpis.map(k => [k.label, k.value]),
      [],
      ['FILTROS APLICADOS', ''],
      ...filtroRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 42 }, { wch: 30 }];
    ws['!rows'] = [
      { hpt: 32 }, { hpt: 22 }, { hpt: 14 }, { hpt: 6 }, { hpt: 20 },
      ...kpis.map(() => ({ hpt: 16 })),
      { hpt: 6 }, { hpt: 18 },
      ...filtroRows.map(() => ({ hpt: 14 }))
    ];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
    ];

    this.styleRange(ws, 0, 0, 0, 1, E.titulo);
    this.styleRange(ws, 1, 1, 0, 1, E.reporte);
    this.styleRange(ws, 2, 2, 0, 1, E.meta);
    this.styleRange(ws, 4, 4, 0, 1, E.encabezado);

    kpis.forEach((_, i) => {
      const r = 5 + i;
      const esPar = i % 2 === 0;
      this.styleRange(ws, r, r, 0, 0, esPar ? E.datoPar : E.datoImpar);
      this.styleRange(ws, r, r, 1, 1, esPar ? E.numeroPar : E.numeroImpar);
    });

    const filtroStart = 5 + kpis.length + 1;
    this.styleRange(ws, filtroStart, filtroStart, 0, 1, E.encabezado);
    filtroRows.forEach((_, i) => {
      this.styleRange(ws, filtroStart + 1 + i, filtroStart + 1 + i, 0, 1, E.meta);
    });

    return ws;
  }

  private buildHojaDatos(tipo: number, datos: any[]): XLSX.WorkSheet {
    const cfg = this.excelConfig[tipo];
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
    const hora = new Date().toLocaleTimeString('es-PE');
    const ncols = cfg.headers.length;
    const E = this.ESTILOS;

    const rows: any[][] = [
      ['UNIVERSIDAD NACIONAL DE SAN MARTÍN - SISTEMA DE INVENTARIO'],
      [`REPORTE: ${cfg.titulo}`],
      [`Generado el: ${fecha} a las ${hora}`],
      [`Total de registros: ${datos.length}`],
      [],
      cfg.headers,
      ...datos.map((item, i) => cfg.mapper(item, i))
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = cfg.headers.map((h, i) => ({ wch: i === 0 ? 5 : Math.max(h.length + 6, 20) }));
    ws['!rows'] = [
      { hpt: 32 }, { hpt: 22 }, { hpt: 14 }, { hpt: 14 }, { hpt: 6 }, { hpt: 20 },
      ...datos.map(() => ({ hpt: 16 }))
    ];
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: ncols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: ncols - 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: ncols - 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: ncols - 1 } }
    ];

    this.styleRange(ws, 0, 0, 0, ncols - 1, E.titulo);
    this.styleRange(ws, 1, 1, 0, ncols - 1, E.reporte);
    this.styleRange(ws, 2, 3, 0, ncols - 1, E.meta);
    this.styleRange(ws, 5, 5, 0, ncols - 1, E.encabezado);

    const colsNum = new Set<number>(cfg.colsNumericas);

    datos.forEach((_, i) => {
      const r = 6 + i;
      const esPar = i % 2 === 0;

      this.styleRange(ws, r, r, 0, 0, esPar ? E.nroPar : E.nroImpar);

      for (let c = 1; c < ncols; c++) {
        const isNum = colsNum.has(c);
        const style = isNum
          ? (esPar ? E.numeroPar : E.numeroImpar)
          : (esPar ? E.datoPar : E.datoImpar);
        this.styleRange(ws, r, r, c, c, style);
        if (isNum) {
          const ref = XLSX.utils.encode_cell({ r, c });
          if (ws[ref]) ws[ref].z = '"S/ "#,##0.00';
        }
      }
    });

    return ws;
  }

  exportarExcel() {
    if (this.tablaDatos.length === 0) {
      return;
    }

    const wb = XLSX.utils.book_new();
    const cfg = this.excelConfig[this.activeTab];

    XLSX.utils.book_append_sheet(wb, this.buildHojaIndicadores(cfg.titulo, this.kpis), 'Indicadores');
    XLSX.utils.book_append_sheet(wb, this.buildHojaDatos(this.activeTab, this.tablaDatos), cfg.hoja);

    XLSX.writeFile(wb, `Reporte_${cfg.hoja}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportandoCompleto = false;

  exportarReporteCompleto() {
    this.exportandoCompleto = true;
    const wb = XLSX.utils.book_new();

    const requests = [0, 1, 2, 3].map(tipo => {
      const req: any = {
        tipo,
        fechaInicio: this.filtroFechaInicio?.toISOString(),
        fechaFin: this.filtroFechaFin?.toISOString(),
        estado: this.filtroEstado,
        categoriaId: this.filtroCategoriaId > 0 ? this.filtroCategoriaId : undefined,
        ubicacionIds: this.idsUbicacionesPermitidas.length > 0 ? this.idsUbicacionesPermitidas : undefined
      };
      return lastValueFrom(this.reportesService.generarReporte(req));
    });

    Promise.all(requests).then(resultados => {
      const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

      // Hoja resumen
      const resumenRows: any[][] = [
        ['UNIVERSIDAD NACIONAL DE SAN MARTÍN - SISTEMA DE INVENTARIO'],
        ['REPORTE COMPLETO DEL SISTEMA'],
        [`Generado el: ${fecha}`],
        [],
        ['MÓDULO', 'INDICADOR', 'VALOR'],
        ...resultados.flatMap((res: any, tipo) => {
          const cfg = this.excelConfig[tipo];
          return (res?.kpis ?? []).map((k: any) => [cfg.titulo, k.label, k.value]);
        })
      ];
      const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
      wsResumen['!cols'] = [{ wch: 30 }, { wch: 35 }, { wch: 20 }];
      wsResumen['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } }
      ];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen General');

      // Una hoja por módulo
      resultados.forEach((res: any, tipo) => {
        const cfg = this.excelConfig[tipo];
        const datos = res?.tabla ?? [];
        XLSX.utils.book_append_sheet(wb, this.buildHojaDatos(tipo, datos), cfg.hoja);
      });

      XLSX.writeFile(wb, `ReporteCompleto_${new Date().toISOString().split('T')[0]}.xlsx`);
      this.exportandoCompleto = false;
    }).catch(() => {
      this.exportandoCompleto = false;
    });
  }
}
