import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { PrestamosService } from '../../core/services/prestamos.service';
import { ArticuloService } from '../../core/services/articulos.service';
import { NgxPaginationModule } from 'ngx-pagination';
import Swal from 'sweetalert2';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { RolesService } from '../../core/services/roles.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule, NgxPaginationModule, RouterModule],
  templateUrl: './prestamos.component.html',
  styleUrls: ['./prestamos.component.css']
})
export class PrestamoComponent implements OnInit {
usuarioActual: any;
ubicacionId: number | null = null
  p: number = 1;
aprobado: boolean = false;  // --- Propiedades para el Layout Responsivo ---
  menuAbierto = false; // Controla si el menú lateral se muestra en móviles
listaUbicaciones: any[] = [];
idsUbicacionesPermitidas: number[] = [];
articulosTodos: any[] = [];

// --- Firma de préstamos ---
puedeFirmarPrestamos = false;
// Devolver un artículo prestado también queda restringido a administradores y superadmin
// (técnicos y practicantes no pueden marcar devoluciones).
puedeDevolverPrestamos = false;
mostrarModalFirma = false;
prestamoSeleccionadoFirma: any = null;
nombreFirmante = '';
firmandoPrestamo = false;
  // --- Datos ---
  prestamos: any[] = [];
  prestamosFiltrados: any[] = [];
  articulosDisponibles: any[] = [];
  mostrarFormulario = false;
  filtroTexto: string = '';
  filtroFecha: string = '';
  @ViewChild('firmaResponsable') firmaResponsableCanvas!: ElementRef;
@ViewChild('firmaSolicitante') firmaSolicitanteCanvas!: ElementRef;

firmaResponsableImg: string = '';
firmaSolicitanteImg: string = '';
ngAfterViewInit() {

  if (this.firmaResponsableCanvas?.nativeElement) {
    this.iniciarFirma(this.firmaResponsableCanvas.nativeElement);
  }

  if (this.firmaSolicitanteCanvas?.nativeElement) {
    this.iniciarFirma(this.firmaSolicitanteCanvas.nativeElement);
  }
}
registrarTodo(){};
iniciarFirma(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let dibujando = false;

  canvas.addEventListener('mousedown', () => dibujando = true);
  canvas.addEventListener('mouseup', () => {
    dibujando = false;
    ctx.beginPath();
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!dibujando) return;
    ctx.lineWidth = 2;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  });
}limpiarFirma(tipo: string) {
  const canvas = tipo === 'responsable'
    ? this.firmaResponsableCanvas.nativeElement
    : this.firmaSolicitanteCanvas.nativeElement;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
generarPDF() {

  // Convertir firmas a imagen
  this.firmaResponsableImg = this.firmaResponsableCanvas.nativeElement.toDataURL();
  this.firmaSolicitanteImg = this.firmaSolicitanteCanvas.nativeElement.toDataURL();

  setTimeout(() => {
    const data = document.getElementById('documentoPDF')!;

    html2canvas(data).then(canvas => {

      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      pdf.save('prestamo.pdf');
    });

  }, 300);
}
  // Paginación manual para match con Artículos
  paginaActual = 1;
  pageSize = 5;
  totalPaginas = 1;
  registrosPaginados: any[] = [];

  nuevoPrestamo: any = {
    ArticuloId: null,
    NombreSolicitante: '',
    FechaPrestamo: new Date().toISOString().split('T')[0],
    FechaDevolucion: '',
  };

constructor(
  private _prestamosService: PrestamosService,
  private _articulosService: ArticuloService,
  private _ubicacionService: UbicacionService,   // 🔥 FALTABA
  private _rolesService: RolesService
) { }
ngOnInit(): void {

  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  this.usuarioActual = usuario;

  const escuelaId = Number(localStorage.getItem('escuelaId'));

  this.evaluarPermisoFirma();

  if (escuelaId) {
    this._articulosService.getArticulosPorEscuela(escuelaId).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : res?.data ?? [];
        this.articulosTodos = data;
        this.articulosDisponibles = data;
        this.cargarPrestamosPorEscuela();
      },
      error: (err) => console.error('Error cargando artículos', err)
    });
  } else {
    // superadmin o usuario sin escuela: cargar todos los préstamos
    this.cargarTodosPrestamos();
  }
}

evaluarPermisoFirma(): void {
  this.puedeFirmarPrestamos = false;
  this.puedeDevolverPrestamos = false;

  const rolId = Number(localStorage.getItem('rolId'));
  if (!rolId) return;

  this._rolesService.getRolById(rolId).subscribe({
    next: (res: any) => {
      const nombreRol: string = (res?.data?.rol?.nombre ?? res?.data?.nombre ?? '').trim().toLowerCase();
      const esSuperAdmin = nombreRol === 'superadmin';
      // rolId === 1 es el administrador "clásico" (puede tener el nombre "Admin" o "Administrador").
      const esAdmin = rolId === 1 || nombreRol === 'admin' || nombreRol === 'administrador';

      this.puedeFirmarPrestamos = esSuperAdmin || esAdmin;
      this.puedeDevolverPrestamos = esSuperAdmin || esAdmin;
    },
    error: (err) => console.error('Error verificando rol para firma', err)
  });
}
  // --- Lógica del Menú Hamburguesa ---
  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }
cargarUbicaciones(): void {
  const usuario = JSON.parse(localStorage.getItem('user') || 'null');
  const usuarioId = usuario?.data?.id;

  if (!usuarioId) return;

  this._ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (resp: any) => {

      const ubicaciones = Array.isArray(resp) ? resp : resp?.data ?? [];
      const padreId = ubicaciones[0]?.id;

      this._ubicacionService.getUbicacionesPorPadre(padreId).subscribe({
        next: (res: any) => {

          this.listaUbicaciones = Array.isArray(res) ? res : res?.data ?? [];
          this.idsUbicacionesPermitidas = this.listaUbicaciones.map(u => u.id);

          this.cargarArticulosDisponibles(); // 👈 sigue flujo
        }
      });
    }
  });
}
cargarPrestamos() {

  console.log("Ubicación enviada:", this.ubicacionId);

  this._prestamosService.getPrestamosPorUbicacion(this.ubicacionId!)
    .subscribe({
      next: (res: any) => {

        console.log("RESPUESTA PRESTAMOS:", res);

        const data = res.data || [];

        this.prestamos = data;
        this.prestamosFiltrados = [...data];

        console.log("PRESTAMOS:", this.prestamos);

        this.actualizarPaginacion();
      },
      error: (err) => {
        console.error("Error cargando préstamos", err);
      }
    });
}

recargarPrestamos() {
  const escuelaId = Number(localStorage.getItem('escuelaId'));
  if (escuelaId) {
    this.cargarPrestamosPorEscuela();
  } else {
    this.cargarTodosPrestamos();
  }
}

cargarTodosPrestamos() {
  this._articulosService.getArticulosConCampos().subscribe({
    next: (res: any) => {
      const arts = Array.isArray(res) ? res : res?.data ?? [];
      this.articulosTodos = arts;
      this.articulosDisponibles = arts;
    },
    error: (err) => console.error('Error cargando artículos', err)
  });

  this._prestamosService.getPrestamos().subscribe({
    next: (res: any) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      this.prestamos = data;
      this.prestamosFiltrados = [...data];
      this.actualizarPaginacion();
    },
    error: (err) => console.error('Error cargando préstamos', err)
  });
}

cargarPrestamosPorEscuela() {

  this._prestamosService.getPrestamos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res) ? res : res?.data ?? [];

      const idsArticulos = new Set(
        this.articulosDisponibles.map((a: any) => Number(a.id))
      );

      this.prestamos = data.filter((p: any) =>
        idsArticulos.has(Number(p.articuloId))
      );
      this.prestamosFiltrados = [...this.prestamos];

      // 🔍 DIAGNÓSTICO: revisar si el endpoint de listado trae firmadoPor/fechaFirma
      console.log('🖊️ Campos del primer préstamo recibido del backend:', this.prestamos[0]);

      this.actualizarPaginacion();
    },
    error: (err) => {
      console.error("Error cargando préstamos", err);
    }
  });
}


getUbicacionUsuario(): number | null {

  const ubicaciones = JSON.parse(localStorage.getItem('ubicacionUsuario') || '[]');

  if (!Array.isArray(ubicaciones) || ubicaciones.length === 0) {
    return null;
  }

  // toma la primera ubicación (o puedes ajustar lógica si hay varias)
  return ubicaciones[0].id ?? null;
}
cambiarAEstado2(prestamo: any) {

  Swal.fire({
    title: '¿Cambiar estado?',
    text: 'Se cambiará el estado a 2',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Cancelar'
  }).then(result => {

    if (result.isConfirmed) {

      this._prestamosService
        .cambiarEstado2(prestamo.id)
        .subscribe({
          next: () => {

            Swal.fire('OK', 'Estado actualizado', 'success');
            this.cargarPrestamos();

          },
          error: (err) => {

            Swal.fire('Error', err?.error?.message || 'No se pudo actualizar', 'error');

          }
        });

    }

  });

}
verPDF(prestamo: any) {

  if (!prestamo.rutaPdf) {
    Swal.fire('Error', 'No hay PDF disponible', 'error');
    return;
  }

  const url = `http://https://inventarioti.unsm.edu.pe/8:8081/${prestamo.rutaPdf}`;

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
aprobarPrestamo(p: any) {

  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Se aprobará el préstamo',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, aprobar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16a34a',
    cancelButtonColor: '#ef4444'
  }).then((result) => {

    if (result.isConfirmed) {
this._prestamosService.cambiarEstado2(p.id).subscribe({
  next: () => {

    Swal.fire({
      icon: 'success',
      title: 'Aprobado',
      text: 'El préstamo fue aprobado correctamente'
    }).then(() => {

      window.location.reload(); // recarga toda la página

    });

  },
  error: () => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo aprobar el préstamo'
    });
  }
});

    }

  });

}

estaFirmado(p: any): boolean {
  return !!(p?.firmadoPor || p?.FirmadoPor);
}

getFirmadoPor(p: any): string {
  return p?.firmadoPor || p?.FirmadoPor || '';
}

getFechaFirma(p: any): any {
  return p?.fechaFirma || p?.FechaFirma || null;
}

abrirModalFirma(p: any) {
  if (!this.puedeFirmarPrestamos) {
    Swal.fire('No autorizado', 'Solo los administradores y superadministradores pueden firmar préstamos', 'warning');
    return;
  }

  this.prestamoSeleccionadoFirma = p;
  this.nombreFirmante = this.obtenerNombreUsuarioActual();
  this.mostrarModalFirma = true;
}

obtenerNombreUsuarioActual(): string {
  const datos = this.usuarioActual?.data ?? this.usuarioActual;
  if (!datos) return '';
  return `${datos.nombre ?? ''} ${datos.apellido ?? ''}`.trim();
}

cerrarModalFirma() {
  this.mostrarModalFirma = false;
  this.prestamoSeleccionadoFirma = null;
  this.nombreFirmante = '';
}

confirmarFirma() {
  if (!this.nombreFirmante.trim()) {
    Swal.fire('Validación', 'Ingrese el nombre del firmante', 'warning');
    return;
  }

  const prestamo = this.prestamoSeleccionadoFirma;
  if (!prestamo) return;

  this.firmandoPrestamo = true;

  this._prestamosService.firmarPrestamo(prestamo.id, this.nombreFirmante.trim()).subscribe({
    next: (res: any) => {
      this.firmandoPrestamo = false;

      const actualizado = res?.data ?? res;

      prestamo.firmadoPor =
        actualizado?.firmadoPor ?? actualizado?.FirmadoPor ?? this.nombreFirmante.trim();
      prestamo.fechaFirma =
        actualizado?.fechaFirma ?? actualizado?.FechaFirma ?? new Date().toISOString();

      // Firmar aprueba automáticamente el préstamo en el backend
      prestamo.aprobar = actualizado?.aprobar ?? actualizado?.Aprobar ?? true;

      this.actualizarPaginacion();
      Swal.fire('Firmado', 'El préstamo fue firmado y aprobado correctamente', 'success');
      this.cerrarModalFirma();
    },
    error: (err) => {
      this.firmandoPrestamo = false;

      console.error('Error al firmar préstamo:', err);

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
        `No se pudo firmar el préstamo (HTTP ${err?.status ?? '400'})`;

      Swal.fire('Error', String(msg), 'error');
    }
  });
}

aplicarFiltroPrestamos() {

  const mapaArticulos = new Map(
    this.articulosDisponibles.map(a => [Number(a.id), a])
  );

  this.prestamosFiltrados = this.prestamos.filter(p => {

    const articulo = mapaArticulos.get(Number(p.articuloId));

if (!articulo) {
  console.warn("Préstamo sin artículo válido:", p);
  return false; // ✔ ocultar o manejar controladamente
}
    return this.idsUbicacionesPermitidas.includes(articulo.ubicacionId);
  });

  this.actualizarPaginacion();
}
cargarArticulosDisponibles() {

  this._articulosService.getArticulosConCampos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res) ? res : res?.data ?? [];

      this.articulosTodos = data; // ← IMPORTANTE

      this.articulosDisponibles = data.filter((a: any) =>
        this.idsUbicacionesPermitidas.includes(a.ubicacionId) ||
        Number(a.ubicacionId) === 100
      );

      this.cargarPrestamos();
    }
  });
}
aplicarFiltroArticulos() {

  if (!this.idsUbicacionesPermitidas.length) return;

  this.articulosDisponibles = this.articulosDisponibles.filter(a =>
    this.idsUbicacionesPermitidas.includes(a.ubicacionId)
  );
}
getNombreArticulo(id: number): string {

  const articulo =
    this.articulosDisponibles.find(a => Number(a.id) === Number(id)) ||
    this.articulosTodos.find(a => Number(a.id) === Number(id));

  if (!articulo) {
    return 'Desconocido';
  }

  return `${articulo.codigoPatrimonial} - ${articulo.nombre}`;
}
getArticulo(id: number) {
  return (
    this.articulosDisponibles.find(a => Number(a.id) === Number(id)) ||
    this.articulosTodos.find(a => Number(a.id) === Number(id))
  );
}
  aplicarFiltro() {
    const texto = this.filtroTexto.toLowerCase();

    this.prestamosFiltrados = this.prestamos.filter(p => {
      const cumpleTexto = !texto ||
        (p.nombreArticulo?.toLowerCase().includes(texto)) ||
        (p.nombreSolicitante?.toLowerCase().includes(texto));

      const cumpleFecha = !this.filtroFecha ||
        (p.fechaPrestamo && p.fechaPrestamo.split('T')[0] === this.filtroFecha);

      return cumpleTexto && cumpleFecha;
    });

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    this.totalPaginas = Math.ceil(this.prestamosFiltrados.length / this.pageSize);
    if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;

    const inicio = (this.paginaActual - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    this.registrosPaginados = this.prestamosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(nueva: number) {
    if (nueva >= 1 && nueva <= this.totalPaginas) {
      this.paginaActual = nueva;
      this.actualizarPaginacion();
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  resetFormulario() {
    this.nuevoPrestamo = {
      ArticuloId: null,
      NombreSolicitante: '',
      FechaPrestamo: new Date().toISOString().split('T')[0],
      FechaDevolucion: ''
    };
  }
registrarPrestamo() {

  console.log("CLICK");

  if (!this.nuevoPrestamo.ArticuloId || !this.nuevoPrestamo.NombreSolicitante) {
    Swal.fire('Error', 'Completa todos los campos', 'warning');
    return;
  }

  let fechaPrestamo;
  let fechaDevolucion = null;

  try {
    fechaPrestamo = new Date(this.nuevoPrestamo.FechaPrestamo).toISOString();

    if (this.nuevoPrestamo.FechaDevolucion) {
      fechaDevolucion = new Date(this.nuevoPrestamo.FechaDevolucion).toISOString();
    }
  } catch (e) {
    Swal.fire('Error', 'Fecha inválida', 'error');
    return;
  }

const dataParaEnviar = {
  ArticuloId: Number(this.nuevoPrestamo.ArticuloId),
  NombreSolicitante: this.nuevoPrestamo.NombreSolicitante,
  FechaPrestamo: fechaPrestamo,
  FechaDevolucion: fechaDevolucion,
  Estado: 1,
  EstadoPrestamo: true
};
  console.log("ENVIANDO:", dataParaEnviar);

this._prestamosService.addPrestamo(dataParaEnviar).subscribe({
  next: () => {

    Swal.fire(
      '¡Registrado!',
      'El préstamo se ha creado con éxito.',
      'success'
    ).then(() => {

      window.location.reload(); // recarga toda la página

    });

  },
  error: (err) => {
    console.error("Error real:", err);

    const mensajeBackend =
      err?.error?.errors ||
      err?.error?.message ||
      'Hubo un fallo al registrar';

    Swal.fire('Error', mensajeBackend, 'error');
  }
});
}
   marcarDevuelto(prestamo: any) {
    if (!this.puedeDevolverPrestamos) {
      Swal.fire('No autorizado', 'Solo los administradores y superadministradores pueden marcar devoluciones', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Confirmar devolución?',
      text: `El equipo será marcado como devuelto`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, devuelto',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        const idFinal = prestamo.id || prestamo.idPrestamo;

        const updateData = {
          ...prestamo,
          Id: idFinal,
          Estado: 1,
          EstadoPrestamo: false
        };

        this._prestamosService.updatePrestamo(idFinal, updateData).subscribe({
          next: () => {
            Swal.fire('Actualizado', 'Equipo marcado como devuelto', 'success');
            this.recargarPrestamos();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
          }
        });
      }
    });
  }
  articuloSeleccionado: any = null;

onArticuloChange() {
  this.articuloSeleccionado = this.articulosDisponibles.find(
    a => a.id == this.nuevoPrestamo.ArticuloId
  );
}
pasoActual = 1;

solicitud = {
  asunto: '',
  cargo: '',
  institucion: '',
  descripcionGeneral: '',
  evento: '',
  lugar: '',
  fechaInicio: ''
};
}
