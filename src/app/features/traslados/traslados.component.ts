import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { SearchableSelectComponent, OpcionSelect } from '../../shared/components/searchable-select/searchable-select.component';
import Swal from 'sweetalert2';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Servicios
import { TrasladosService } from '../../core/services/traslados.service';
import { ArticuloService } from '../../core/services/articulos.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { RolesService } from '../../core/services/roles.service';

@Component({
  selector: 'app-traslados',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule, SearchableSelectComponent],
  templateUrl: './traslados.component.html',
  styleUrls: ['./traslados.component.css']
})
export class TrasladosComponent implements OnInit {

  mostrarFormulario = false;
  menuAbierto = false;

  filtroTexto: string = '';
  filtroFecha: string = '';
ubicacionUsuarioId: number = 0;
  usuarioActual: any;

  // --- Firma de traslados ---
  puedeFirmarTraslados = false;
  mostrarModalFirma = false;
  trasladoSeleccionadoFirma: any = null;
  nombreFirmante = '';
  firmandoTraslado = false;
  generandoDocumento = false;

  @ViewChild('documentoPdfTraslado') documentoPdfTraslado!: ElementRef;

  traslados: any[] = [];
  listaArticulos: any[] = [];
  listaUbicaciones: any[] = [];
  opcionesUbicaciones: OpcionSelect[] = [];
articuloBusqueda: string = '';
articulosFiltrados: any[] = [];
mostrarListaArticulos = false;
  nuevoTraslado: any = {
    articulo: '',
    origen: '',
    destino: '',
    observaciones: ''
  };

  paginaActual = 1;
  registrosPorPagina = 3;

  constructor(
    private trasladoService: TrasladosService,
    private articuloService: ArticuloService,
    private ubicacionService: UbicacionService,
    private rolesService: RolesService
  ) { }

  ngOnInit(): void {
    this.usuarioActual = JSON.parse(localStorage.getItem('user') || '{}');
    this.evaluarPermisoFirma();
    this.cargarDatosIniciales();
  }

  esAdministrador(): boolean {
    return Number(localStorage.getItem('rolId')) === 1;
  }

  evaluarPermisoFirma(): void {
    this.puedeFirmarTraslados = false;

    const rolId = Number(localStorage.getItem('rolId'));
    if (!rolId) return;

    this.rolesService.getRolById(rolId).subscribe({
      next: (res: any) => {
        const nombreRol: string = (res?.data?.rol?.nombre ?? res?.data?.nombre ?? '').trim().toLowerCase();
        const esSuperAdmin = nombreRol === 'superadmin';
        // rolId === 1 es el administrador "clásico" (puede tener el nombre "Admin" o "Administrador").
        const esAdmin = rolId === 1 || nombreRol === 'admin' || nombreRol === 'administrador';

        this.puedeFirmarTraslados = esSuperAdmin || esAdmin;
      },
      error: (err) => console.error('Error verificando rol para firma', err)
    });
  }
cargarPorEscuela(): void {
  const escuelaId = Number(localStorage.getItem('escuelaId'));

  if (!escuelaId) {
    this.cargarUbicaciones();
    return;
  }

  this.ubicacionService.getUbicacionesPorEscuela(escuelaId).subscribe({
    next: (res: any) => {
      this.listaUbicaciones = Array.isArray(res) ? res : res?.data ?? [];
      this.actualizarOpcionesUbicaciones();

      this.articuloService.getArticulosPorEscuela(escuelaId).subscribe({
        next: (r: any) => {
          this.listaArticulos = Array.isArray(r) ? r : r?.data ?? [];
          this.articulosFiltrados = [...this.listaArticulos];
          this.cargarTraslados();
        },
        error: () => Swal.fire('Error', 'No se pudieron cargar los artículos', 'error')
      });
    },
    error: () => Swal.fire('Error', 'No se pudieron cargar las ubicaciones', 'error')
  });
}

filtrarArticulos(): void {

  const texto = this.articuloBusqueda.toLowerCase().trim();

  this.articulosFiltrados = this.listaArticulos.filter(a =>
    a.nombre?.toLowerCase().includes(texto) ||
    a.codigoPatrimonial?.toLowerCase().includes(texto)
  );

  this.mostrarListaArticulos = true;
}

seleccionarArticulo(articulo: any): void {

  this.nuevoTraslado.articulo = articulo.id;

  this.articuloBusqueda =
    `${articulo.codigoPatrimonial} - ${articulo.nombre}`;

  this.mostrarListaArticulos = false;

  this.onArticuloChange(articulo.id);
}
  cargarDatosIniciales(): void {
    if (this.esAdministrador()) {
      this.cargarTodasLasUbicaciones();
    } else {
      this.cargarPorEscuela();
    }
  }
cargarTraslados(): void {
  this.trasladoService.getTraslados().subscribe({
    next: (resp: any) => {

      const data = Array.isArray(resp) ? resp : resp?.data ?? [];

      // 🔥 IDs permitidos (ubicaciones hijas)
      const idsUbicaciones = this.listaUbicaciones.map(u => u.id);

      console.log('✅ IDS UBICACIONES:', idsUbicaciones);

      // 🔥 FILTRAR TRASLADOS
      this.traslados = data.filter((t: any) =>
        idsUbicaciones.includes(t.ubicacionOrigenId) ||
        idsUbicaciones.includes(t.ubicacionDestinoId)
      );

      console.log('📦 TRASLADOS FILTRADOS:', this.traslados);

      this.paginaActual = 1;
    },
    error: () => Swal.fire('Error', 'No se pudieron cargar los traslados', 'error')
  });
}
cargarArticulos(): void {

  this.articuloService.getArticulosConCampos().subscribe({
    next: (resp: any) => {

      const data = Array.isArray(resp)
        ? resp
        : resp?.data ?? [];

      // Solo artículos que están físicamente en la ubicación asignada al usuario.
      this.listaArticulos = data.filter((a: any) =>
        Number(a.ubicacionId) === this.ubicacionUsuarioId
      );

      this.articulosFiltrados = [...this.listaArticulos];
    },
    error: () => {
      console.error('Error cargando artículos');
    }
  });

}
cargarUbicaciones(): void {

  const usuario = JSON.parse(localStorage.getItem('user') || '{}');

  const usuarioId =
    usuario?.data?.id ||
    usuario?.id ||
    usuario?.usuarioId;

  if (!usuarioId) return;

  this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (resp: any) => {

      const ubicacionesUsuario = Array.isArray(resp)
        ? resp
        : resp?.data ?? [];

      if (ubicacionesUsuario.length === 0) {
        this.listaUbicaciones = [];
        this.actualizarOpcionesUbicaciones();
        this.listaArticulos = [];
        return;
      }

      // ubicación principal
      this.ubicacionUsuarioId = Number(ubicacionesUsuario[0].id);

      this.ubicacionService.getUbicacionesPorPadre(this.ubicacionUsuarioId).subscribe({
        next: (res: any) => {

          this.listaUbicaciones = Array.isArray(res)
            ? res
            : res?.data ?? [];
          this.actualizarOpcionesUbicaciones();


          this.cargarArticulos();
          this.cargarTraslados();
        },
        error: (err) => {
          console.error('Error obteniendo ubicaciones hijas', err);
        }
      });

    },
    error: (err) => {
      console.error('Error obteniendo ubicaciones del usuario', err);
    }
  });

}
  cargarTodasLasUbicaciones(): void {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res?.data ?? [];
        this.listaUbicaciones = data;
        this.actualizarOpcionesUbicaciones();
        this.cargarArticulosSinFiltro();
        this.cargarTrasladosSinFiltro();
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar las ubicaciones', 'error')
    });
  }

  cargarArticulosSinFiltro(): void {
    this.articuloService.getArticulosConCampos().subscribe({
      next: (resp: any) => {
        this.listaArticulos = Array.isArray(resp) ? resp : resp?.data ?? [];
        this.articulosFiltrados = [...this.listaArticulos];
      },
      error: () => console.error('Error cargando artículos')
    });
  }

  cargarTrasladosSinFiltro(): void {
    this.trasladoService.getTraslados().subscribe({
      next: (resp: any) => {
        this.traslados = Array.isArray(resp) ? resp : resp?.data ?? [];
        this.paginaActual = 1;
      },
      error: () => Swal.fire('Error', 'No se pudieron cargar los traslados', 'error')
    });
  }

  // FILTROS
  get trasladosFiltrados(): any[] {
    return this.traslados.filter(t => {
      const texto = this.filtroTexto.toLowerCase();

      const coincideTexto =
        t.articulo?.nombre?.toLowerCase().includes(texto) ||
        t.ubicacionOrigen?.nombre?.toLowerCase().includes(texto) ||
        t.ubicacionDestino?.nombre?.toLowerCase().includes(texto);

      const coincideFecha = this.filtroFecha
        ? t.fechaTraslado?.includes(this.filtroFecha)
        : true;

      return coincideTexto && coincideFecha;
    });
  }

  aplicarFiltro(): void {
    this.paginaActual = 1;
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  // PAGINACIÓN
  get totalRegistros(): number {
    return this.trasladosFiltrados.length;
  }

  get totalPaginas(): number {
    return Math.ceil(this.totalRegistros / this.registrosPorPagina);
  }

  get registrosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.trasladosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // FORMULARIO
  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) this.limpiarFormulario();
  }
onArticuloChange(articuloId: any): void {
  if (!articuloId) return;

  this.articuloService.getArticuloById(articuloId).subscribe({
    next: (resp: any) => {

      const art = resp?.data;

      if (!art) return;

      console.log('📦 ARTÍCULO SELECCIONADO:', art);

      // 🔥 AQUÍ SE AUTOCARGA LA UBICACIÓN
      this.nuevoTraslado.origen = Number(art.ubicacionId);

    },
    error: () => {
      Swal.fire('Error', 'No se pudo obtener la ubicación del artículo', 'error');
      this.nuevoTraslado.origen = '';
    }
  });
}
  private actualizarOpcionesUbicaciones(): void {
    this.opcionesUbicaciones = this.listaUbicaciones.map(u => ({ value: u.id, label: u.nombre }));
  }

  // ✅ FIX: evitar error find cuando no es array
  getNombreUbicacion(id: any): string {
    if (!Array.isArray(this.listaUbicaciones)) return 'Cargando...';

    const ubicacion = this.listaUbicaciones.find(u => u.id == id);
    return ubicacion ? ubicacion.nombre : 'Seleccione un artículo...';
  }

  get articuloSeleccionadoTraslado(): any {
    return this.listaArticulos.find(a => a.id == this.nuevoTraslado.articulo);
  }

  get hoy(): Date {
    return new Date();
  }

  guardarTraslado(): void {
    if (this.nuevoTraslado.origen === this.nuevoTraslado.destino) {
      Swal.fire('Atención', 'El destino no puede ser igual al origen', 'warning');
      return;
    }
const usuario = JSON.parse(localStorage.getItem('user') || '{}');
const usuarioId = usuario?.data?.id;

const payload = {
  articuloId: Number(this.nuevoTraslado.articulo),
  ubicacionOrigenId: Number(this.nuevoTraslado.origen),
  ubicacionDestinoId: Number(this.nuevoTraslado.destino),
  fechaTraslado: new Date().toISOString(),
  observaciones: this.nuevoTraslado.observaciones,
  usuarioId: usuarioId
};
    this.trasladoService.realizarTraslado(payload).subscribe({
      next: async (res: any) => {
        console.log('📥 Respuesta al registrar traslado:', res);

        const trasladoCreado = res?.data ?? res;
        let trasladoId =
          trasladoCreado?.id ?? trasladoCreado?.Id ??
          trasladoCreado?.trasladoId ?? trasladoCreado?.TrasladoId ?? null;

        if (!trasladoId) {
          // El backend no devolvió el id en la respuesta del POST:
          // se busca el traslado recién creado en el listado.
          trasladoId = await this.resolverTrasladoIdRecienCreado(payload);
        }

        if (!trasladoId) {
          console.warn('⚠️ No se pudo determinar el id del traslado creado; no se generará el documento.');
          Swal.fire('Traslado registrado', 'El traslado se registró, pero no se pudo generar el documento automáticamente', 'warning');
          this.cargarTraslados();
          this.toggleFormulario();
          return;
        }

        this.generandoDocumento = true;

        try {
          // Se captura el documento ANTES de limpiar el formulario, ya que la
          // plantilla oculta se alimenta de los datos actuales de nuevoTraslado.
          const pdfBlob = await this.generarPDFBlobTraslado();

          const formData = new FormData();
          formData.append('TrasladoId', String(trasladoId));
          formData.append('File', pdfBlob, 'traslado.pdf');

          this.trasladoService.uploadPDF(formData).subscribe({
            next: () => {
              this.generandoDocumento = false;
              Swal.fire('¡Éxito!', 'Traslado registrado y documento generado correctamente', 'success');
              this.cargarTraslados();
              this.toggleFormulario();
            },
            error: (err) => {
              this.generandoDocumento = false;
              console.error('Error al subir el documento generado:', err);
              Swal.fire('Traslado registrado', 'El traslado se registró, pero no se pudo generar el documento automáticamente', 'warning');
              this.cargarTraslados();
              this.toggleFormulario();
            }
          });
        } catch (err) {
          this.generandoDocumento = false;
          console.error('Error al generar el PDF del traslado:', err);
          Swal.fire('Traslado registrado', 'El traslado se registró, pero no se pudo generar el documento automáticamente', 'warning');
          this.cargarTraslados();
          this.toggleFormulario();
        }
      },
      error: (err) => Swal.fire('Error', err.error || 'No se pudo registrar', 'error')
    });
  }

  verDetalles(traslado: any): void {
    Swal.fire({
      title: 'Detalles del Traslado',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p><strong>Artículo:</strong> ${traslado.articulo?.nombre}</p>
          <p><strong>Origen:</strong> ${traslado.ubicacionOrigen?.nombre}</p>
          <p><strong>Destino:</strong> ${traslado.ubicacionDestino?.nombre}</p>
          <p><strong>Fecha:</strong> ${new Date(traslado.fechaTraslado).toLocaleString()}</p>
          <p><strong>Observaciones:</strong> ${traslado.observaciones || 'Sin observaciones'}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#00a468'
    });
  }

  limpiarFormulario(): void {
    this.nuevoTraslado = {
      articulo: '',
      origen: '',
      destino: '',
      observaciones: ''
    };
    this.articuloBusqueda = '';
    this.mostrarListaArticulos = false;
    this.articulosFiltrados = [...this.listaArticulos];
  }

  // =========================
  // DOCUMENTO PDF Y FIRMA
  // =========================

  estaFirmado(t: any): boolean {
    return !!(t?.firmadoPor || t?.FirmadoPor);
  }

  getFirmadoPor(t: any): string {
    return t?.firmadoPor || t?.FirmadoPor || '';
  }

  getFechaFirma(t: any): any {
    return t?.fechaFirma || t?.FechaFirma || null;
  }

  tieneRutaPdf(t: any): boolean {
    return !!(t?.rutaPdf || t?.RutaPdf);
  }

  verPDF(t: any): void {
    const ruta = t?.rutaPdf || t?.RutaPdf;

    if (!ruta) {
      Swal.fire('Error', 'No hay PDF disponible', 'error');
      return;
    }

    const url = `http://https://inventarioti.unsm.edu.pe/8:8081/${ruta}`;

    Swal.fire({
      title: 'Vista del documento',
      html: `
        <iframe
          src="${url}"
          width="100%"
          height="500px"
          style="border:none;">
        </iframe>
      `,
      width: '800px',
      showCloseButton: true,
      showConfirmButton: false
    });
  }

  private resolverTrasladoIdRecienCreado(payload: any): Promise<number | null> {
    return new Promise((resolve) => {
      this.trasladoService.getTraslados().subscribe({
        next: (resp: any) => {
          const data = Array.isArray(resp) ? resp : resp?.data ?? [];

          const candidatos = data.filter((t: any) =>
            Number(t.articuloId) === Number(payload.articuloId) &&
            Number(t.ubicacionOrigenId) === Number(payload.ubicacionOrigenId) &&
            Number(t.ubicacionDestinoId) === Number(payload.ubicacionDestinoId)
          );

          if (!candidatos.length) {
            resolve(null);
            return;
          }

          const masReciente = candidatos.reduce((a: any, b: any) =>
            Number(b.id) > Number(a.id) ? b : a
          );

          resolve(masReciente?.id ?? null);
        },
        error: () => resolve(null)
      });
    });
  }

  async generarPDFBlobTraslado(): Promise<Blob> {
    const element = this.documentoPdfTraslado.nativeElement;
    const canvas = await html2canvas(element, { scale: 2 });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    return pdf.output('blob');
  }

  abrirModalFirma(t: any): void {
    if (!this.puedeFirmarTraslados) {
      Swal.fire('No autorizado', 'Solo los administradores y superadministradores pueden firmar traslados', 'warning');
      return;
    }

    if (!this.tieneRutaPdf(t)) {
      Swal.fire('Atención', 'Primero debes subir el documento PDF del traslado', 'warning');
      return;
    }

    this.trasladoSeleccionadoFirma = t;
    this.nombreFirmante = this.obtenerNombreUsuarioActual();
    this.mostrarModalFirma = true;
  }

  obtenerNombreUsuarioActual(): string {
    const datos = this.usuarioActual?.data ?? this.usuarioActual;
    if (!datos) return '';
    return `${datos.nombre ?? ''} ${datos.apellido ?? ''}`.trim();
  }

  cerrarModalFirma(): void {
    this.mostrarModalFirma = false;
    this.trasladoSeleccionadoFirma = null;
    this.nombreFirmante = '';
  }

  confirmarFirma(): void {
    if (!this.nombreFirmante.trim()) {
      Swal.fire('Validación', 'Ingrese el nombre del firmante', 'warning');
      return;
    }

    const traslado = this.trasladoSeleccionadoFirma;
    if (!traslado) return;

    this.firmandoTraslado = true;

    this.trasladoService.firmarTraslado(traslado.id, this.nombreFirmante.trim()).subscribe({
      next: (res: any) => {
        this.firmandoTraslado = false;

        const actualizado = res?.data ?? res;

        traslado.firmadoPor =
          actualizado?.firmadoPor ?? actualizado?.FirmadoPor ?? this.nombreFirmante.trim();
        traslado.fechaFirma =
          actualizado?.fechaFirma ?? actualizado?.FechaFirma ?? new Date().toISOString();

        Swal.fire('Firmado', 'El traslado fue firmado correctamente', 'success');
        this.cerrarModalFirma();
      },
      error: (err) => {
        this.firmandoTraslado = false;

        console.error('Error al firmar traslado:', err);

        const errores = err?.error?.errors;
        const erroresTexto = errores && typeof errores === 'object'
          ? Object.values(errores).flat().join(' | ')
          : null;

        const msg =
          err?.error?.detail ||
          err?.error?.message ||
          err?.error?.Message ||
          erroresTexto ||
          (typeof errores === 'string' ? errores : null) ||
          (err?.error?.title && err.error.title !== 'Bad Request' ? err.error.title : null) ||
          (typeof err?.error === 'string' ? err.error : null) ||
          `No se pudo firmar el traslado (HTTP ${err?.status ?? '400'})`;

        Swal.fire('Error', String(msg), 'error');
      }
    });
  }
}
