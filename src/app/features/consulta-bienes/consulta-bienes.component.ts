import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ArticuloService } from '../../core/services/articulos.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { TipoArticuloService } from '../../core/services/tipo-articulos.service';
import { UsuariosService } from '../../core/services/usuarios.service';
import { SedeService } from '../../core/services/sede.service';
import { FacultadService } from '../../core/services/facultad.service';
import { EscuelaService } from '../../core/services/escuela.service';

@Component({
  selector: 'app-consulta-bienes',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './consulta-bienes.component.html',
  styleUrls: ['./consulta-bienes.component.css']
})
export class ConsultaBienesComponent implements OnInit {

  menuAbierto = false;
  cargando = false;
  filtrosLocked = false;

  busqueda = '';
  filtroSedeId = 0;
  filtroFacultadId = 0;
  filtroEscuelaId = 0;
  filtroUbicacionId = 0;
  filtroEstado = 'Bueno';
  filtroFecha = '';

  ubicacionFiltroLocked = false;

  sedes: any[] = [];
  facultades: any[] = [];
  escuelas: any[] = [];
  facultadesFiltradas: any[] = [];
  escuelasFiltradas: any[] = [];
  ubicacionesFiltradas: any[] = [];

  tipos: any[] = [];
  ubicaciones: any[] = [];
  usuarios: any[] = [];

  bienes: any[] = [];
  bienesFiltrados: any[] = [];

  paginaActual = 1;
  registrosPorPagina = 6;

  constructor(
    private articuloService: ArticuloService,
    private ubicacionService: UbicacionService,
    private tipoArticuloService: TipoArticuloService,
    private usuariosService: UsuariosService,
    private sedeService: SedeService,
    private facultadService: FacultadService,
    private escuelaService: EscuelaService,
    private router: Router
  ) { }

  ngOnInit(): void {
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
    this.cargando = true;

    forkJoin({
      articulos: this.articuloService.getArticulosConCampos(),
      ubicaciones: this.ubicacionService.getUbicaciones(),
      tipos: this.tipoArticuloService.getTipoArticulos(),
      usuarios: this.usuariosService.getUsuarios(),
      sedes: this.sedeService.getSedes(),
      facultades: this.facultadService.getFacultades(),
      escuelas: this.escuelaService.getEscuelas()
    }).subscribe({
      next: (res: any) => {
        this.sedes = this.aArray(res.sedes);
        this.facultades = this.aArray(res.facultades);
        this.escuelas = this.aArray(res.escuelas);
        this.tipos = this.aArray(res.tipos);
        this.ubicaciones = this.aArray(res.ubicaciones);
        this.usuarios = this.aArray(res.usuarios);

        this.facultadesFiltradas = [...this.facultades];
        this.escuelasFiltradas = [...this.escuelas];
        this.ubicacionesFiltradas = [...this.ubicaciones];

        this.bienes = this.aArray(res.articulos).map((a: any) => this.enriquecerBien(a));

        this.aplicarFiltroUsuario();
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los bienes', 'error');
      }
    });
  }

  private enriquecerBien(a: any) {
    const ubicacion = this.ubicaciones.find(u => u.id === a.ubicacionId);
    const escuela = ubicacion ? this.escuelas.find(e => e.id === ubicacion.escuelaId) : null;
    const facultad = escuela ? this.facultades.find(f => f.id === escuela.facultadId) : null;
    const sede = facultad ? this.sedes.find(s => s.id === facultad.sedeId) : null;
    const responsable = ubicacion ? this.usuarios.find(u => u.id === ubicacion.usuarioId) : null;
    const tipo = this.tipos.find(t => t.id === a.tipoArticuloId);

    return {
      ...a,
      categoriaNombre: tipo?.nombre || 'Sin categoría',
      ubicacionNombre: ubicacion?.nombre || 'Sin ubicación',
      escuelaId: escuela?.id ?? null,
      escuelaNombre: escuela?.nombre || '',
      facultadId: facultad?.id ?? null,
      sedeId: sede?.id ?? null,
      sedeNombre: sede?.nombre || 'Sin sede',
      responsableNombre: responsable ? `${responsable.nombre} ${responsable.apellido || ''}`.trim() : 'Sin asignar'
    };
  }

  aplicarFiltroUsuario() {
    const escuelaId = Number(localStorage.getItem('escuelaId'));
    const ubicacionUsuarioId = Number(localStorage.getItem('ubicacionUsuarioId'));

    // Técnico con ubicación puntual asignada: se bloquea TODA la jerarquía
    // (Sede/Facultad/Escuela/Ubicación) a los valores de esa ubicación.
    if (ubicacionUsuarioId) {
      this.fijarUbicacionUsuario(ubicacionUsuarioId);
      this.aplicarFiltro();
      return;
    }

    if (!escuelaId) {
      this.filtrosLocked = false;
      this.ubicacionesFiltradas = [...this.ubicaciones];
      this.aplicarFiltro();
      return;
    }

    const escuela = this.escuelas.find(e => Number(e.id) === escuelaId);
    const facultad = escuela ? this.facultades.find(f => Number(f.id) === Number(escuela.facultadId)) : null;
    const sede = facultad ? this.sedes.find(s => Number(s.id) === Number(facultad.sedeId)) : null;

    this.filtroSedeId = sede ? Number(sede.id) : 0;
    this.filtroFacultadId = facultad ? Number(facultad.id) : 0;
    this.filtroEscuelaId = escuelaId;

    this.facultadesFiltradas = sede
      ? this.facultades.filter(f => Number(f.sedeId) === Number(sede.id))
      : [...this.facultades];

    this.escuelasFiltradas = facultad
      ? this.escuelas.filter(e => Number(e.facultadId) === Number(facultad.id))
      : [...this.escuelas];

    this.filtrosLocked = true;
    this.actualizarUbicacionesFiltradas();
    this.aplicarFiltro();
  }

  private fijarUbicacionUsuario(ubicacionUsuarioId: number) {
    const ubicacion = this.ubicaciones.find(u => Number(u.id) === ubicacionUsuarioId);

    this.filtroUbicacionId = ubicacionUsuarioId;
    this.ubicacionesFiltradas = ubicacion ? [ubicacion] : [];
    this.ubicacionFiltroLocked = true;

    const escuela = ubicacion ? this.escuelas.find(e => Number(e.id) === Number(ubicacion.escuelaId)) : null;
    const facultad = escuela ? this.facultades.find(f => Number(f.id) === Number(escuela.facultadId)) : null;
    const sede = facultad ? this.sedes.find(s => Number(s.id) === Number(facultad.sedeId)) : null;

    this.filtroSedeId = sede ? Number(sede.id) : 0;
    this.filtroFacultadId = facultad ? Number(facultad.id) : 0;
    this.filtroEscuelaId = escuela ? Number(escuela.id) : 0;

    this.facultadesFiltradas = sede
      ? this.facultades.filter(f => Number(f.sedeId) === Number(sede.id))
      : [...this.facultades];

    this.escuelasFiltradas = facultad
      ? this.escuelas.filter(e => Number(e.facultadId) === Number(facultad.id))
      : [...this.escuelas];

    this.filtrosLocked = true;
  }

  actualizarUbicacionesFiltradas() {
    this.ubicacionesFiltradas = this.filtroEscuelaId
      ? this.ubicaciones.filter(u => Number(u.escuelaId) === Number(this.filtroEscuelaId))
      : [...this.ubicaciones];
  }

  onSedeChange() {
    this.filtroFacultadId = 0;
    this.filtroEscuelaId = 0;
    this.filtroUbicacionId = 0;

    this.facultadesFiltradas = this.filtroSedeId
      ? this.facultades.filter(f => f.sedeId === Number(this.filtroSedeId))
      : [...this.facultades];

    this.escuelasFiltradas = [...this.escuelas];
    this.ubicacionesFiltradas = [...this.ubicaciones];

    this.aplicarFiltro();
  }

  onFacultadChange() {
    this.filtroEscuelaId = 0;
    this.filtroUbicacionId = 0;

    this.escuelasFiltradas = this.filtroFacultadId
      ? this.escuelas.filter(e => e.facultadId === Number(this.filtroFacultadId))
      : [...this.escuelas];

    this.ubicacionesFiltradas = [...this.ubicaciones];

    this.aplicarFiltro();
  }

  onEscuelaChange() {
    this.filtroUbicacionId = 0;
    this.actualizarUbicacionesFiltradas();
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    const texto = this.busqueda.trim().toLowerCase();

    this.bienesFiltrados = this.bienes.filter(b => {
      const coincideTexto = !texto ||
        (b.codigoPatrimonial || '').toLowerCase().includes(texto) ||
        (b.nombre || '').toLowerCase().includes(texto) ||
        (b.nroSerie || '').toLowerCase().includes(texto);

      const coincideSede = !this.filtroSedeId || b.sedeId === Number(this.filtroSedeId);
      const coincideFacultad = !this.filtroFacultadId || b.facultadId === Number(this.filtroFacultadId);
      const coincideEscuela = !this.filtroEscuelaId || b.escuelaId === Number(this.filtroEscuelaId);
      const coincideUbicacion = !this.filtroUbicacionId || b.ubicacionId === Number(this.filtroUbicacionId);
      const coincideEstado = this.filtroEstado === 'Todos' || b.condicion === this.filtroEstado;

      const coincideFecha = !this.filtroFecha ||
        (b.fechaAdquision && b.fechaAdquision.substring(0, 10) === this.filtroFecha);

      return coincideTexto && coincideSede && coincideFacultad && coincideEscuela && coincideUbicacion && coincideEstado && coincideFecha;
    });

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.bienesFiltrados.length / this.registrosPorPagina) || 1;
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.bienesFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }

  getBadgeClass(condicion: string): string {
    switch ((condicion || '').toLowerCase()) {
      case 'nuevo': return 'badge-nuevo';
      case 'bueno': return 'badge-bueno';
      case 'regular': return 'badge-regular';
      case 'malo': return 'badge-malo';
      default: return 'badge-default';
    }
  }

  getIconoBien(categoria: string): string {
    const c = (categoria || '').toLowerCase();
    if (c.includes('mobil') || c.includes('escritorio') || c.includes('silla')) return 'fa-chair';
    if (c.includes('servidor')) return 'fa-server';
    if (c.includes('laptop') || c.includes('computad') || c.includes('tecnológ') || c.includes('tecnolog')) return 'fa-laptop';
    return 'fa-box';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const anio = d.getFullYear();
    return `${anio}-${mes}-${dia}`;
  }

  registrarBien() {
    this.router.navigate(['/articulos']);
  }

  verBien(id: number) {
    this.router.navigate(['/tipos-articulos/articulo', id]);
  }

  exportarExcel() {
    if (!this.bienesFiltrados.length) {
      Swal.fire('Sin datos', 'No hay bienes para exportar', 'info');
      return;
    }

    const cabeceras = [
      'Código', 'Nombre / Descripción', 'Categoría', 'Sede',
      'Facultad', 'Escuela', 'Ubicación', 'Responsable', 'Estado', 'Fecha Adquisición'
    ];

    const datos = this.bienesFiltrados.map(b => [
      b.codigoPatrimonial || '',
      b.nombre || '',
      b.categoriaNombre || '',
      b.sedeNombre || '',
      this.facultades.find((f: any) => f.id === b.facultadId)?.nombre || '',
      b.escuelaNombre || '',
      b.ubicacionNombre || '',
      b.responsableNombre || '',
      b.condicion || '',
      this.formatearFecha(b.fechaAdquision)
    ]);

    const ws: any = XLSX.utils.aoa_to_sheet([cabeceras, ...datos]);

    // Anchos de columna
    ws['!cols'] = [
      { wch: 18 }, { wch: 32 }, { wch: 20 }, { wch: 15 },
      { wch: 38 }, { wch: 30 }, { wch: 20 }, { wch: 25 },
      { wch: 12 }, { wch: 20 }
    ];

    // Alto de la fila de cabecera
    ws['!rows'] = [{ hpt: 28 }];

    const letras = ['A','B','C','D','E','F','G','H','I','J'];

    // Estilo cabecera: verde oscuro, texto blanco en negrita
    const estiloHeader = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: '00A468' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top:    { style: 'medium', color: { rgb: '007A4D' } },
        bottom: { style: 'medium', color: { rgb: '007A4D' } },
        left:   { style: 'thin',   color: { rgb: '007A4D' } },
        right:  { style: 'thin',   color: { rgb: '007A4D' } }
      }
    };

    letras.forEach(col => {
      const ref = `${col}1`;
      if (ws[ref]) ws[ref].s = estiloHeader;
    });

    // Estilo filas de datos: alternado verde claro / blanco
    for (let r = 0; r < datos.length; r++) {
      const esPar = r % 2 === 0;
      const estiloFila: any = {
        font: { sz: 10, name: 'Calibri', color: { rgb: '1F2937' } },
        fill: esPar
          ? { patternType: 'solid', fgColor: { rgb: 'F0FDF4' } }
          : { patternType: 'solid', fgColor: { rgb: 'FFFFFF' } },
        alignment: { vertical: 'center' },
        border: {
          top:    { style: 'thin', color: { rgb: 'D1FAE5' } },
          bottom: { style: 'thin', color: { rgb: 'D1FAE5' } },
          left:   { style: 'thin', color: { rgb: 'D1FAE5' } },
          right:  { style: 'thin', color: { rgb: 'D1FAE5' } }
        }
      };

      letras.forEach(col => {
        const ref = `${col}${r + 2}`;
        if (ws[ref]) ws[ref].s = estiloFila;
      });
    }

    const wb: any = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario Bienes');
    XLSX.writeFile(wb, `Inventario_Bienes_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  imprimirPDF() {
    const tabla = document.getElementById('tablaBienes');
    if (!tabla) return;

    html2canvas(tabla, { scale: 2 }).then(canvas => {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.setFontSize(14);
      pdf.text('Inventario y Consultas de Bienes', 14, 15);
      pdf.addImage(imgData, 'PNG', 0, 20, pageWidth, imgHeight);
      pdf.save(`Inventario_Bienes_${new Date().toISOString().split('T')[0]}.pdf`);
    });
  }
}
