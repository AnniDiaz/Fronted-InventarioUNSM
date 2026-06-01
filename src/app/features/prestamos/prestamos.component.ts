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

  p: number = 1;
aprobado: boolean = false;  // --- Propiedades para el Layout Responsivo ---
  menuAbierto = false; // Controla si el menú lateral se muestra en móviles
listaUbicaciones: any[] = [];
idsUbicacionesPermitidas: number[] = [];
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
  private _ubicacionService: UbicacionService   // 🔥 FALTABA
) { }
ngOnInit(): void {
  this.cargarUbicaciones();
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
      if (!ubicaciones.length) return;

      const padreId = ubicaciones[0].id;

      this._ubicacionService.getUbicacionesPorPadre(padreId).subscribe({
        next: (res: any) => {

          this.listaUbicaciones = Array.isArray(res) ? res : res?.data ?? [];
          this.idsUbicacionesPermitidas = this.listaUbicaciones.map(u => u.id);

          // 🔥 SIGUIENTE PASO
          this.cargarArticulosDisponibles();
        }
      });
    }
  });
}
cargarPrestamos() {
  this._prestamosService.getPrestamos().subscribe({
    next: (res: any) => {

      const data = res.data || [];

      this.prestamos = data.filter((p: any) => {

        const articulo = this.articulosDisponibles.find((a: any) => a.id === p.articuloId);

        if (!articulo) return false;

        return this.idsUbicacionesPermitidas.includes(articulo.ubicacionId);
      });

      this.aplicarFiltro();
    }
  });
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

  const url = `http://localhost:7000/${prestamo.rutaPdf}`;

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

          p.aprobado = true; // oculta botón

          Swal.fire({
            icon: 'success',
            title: 'Aprobado',
            text: 'El préstamo fue aprobado correctamente'
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
aplicarFiltroPrestamos() {

  if (!this.idsUbicacionesPermitidas.length) {
    this.prestamosFiltrados = [...this.prestamos];
    this.actualizarPaginacion();
    return;
  }

  this.prestamosFiltrados = this.prestamos.filter(p => {

    const articulo = this.articulosDisponibles.find(a => a.id === p.articuloId);

    if (!articulo) return false;

    return this.idsUbicacionesPermitidas.includes(articulo.ubicacionId);
  });

  this.actualizarPaginacion();
}
cargarArticulosDisponibles() {
  this._articulosService.getArticulos().subscribe({
    next: (res: any) => {

      const data = res.data || [];

      this.articulosDisponibles = data.filter((a: any) =>
        this.idsUbicacionesPermitidas.includes(a.ubicacionId)
      );

      // 🔥 siguiente paso
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

getNombreArticulo(id: number) {
  const articulo = this.articulosDisponibles.find(a => a.id === id);
  return articulo ? articulo.nombre : 'Desconocido';
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
      Swal.fire('¡Registrado!', 'El préstamo se ha creado con éxito.', 'success');
      this.generarPDF();
      this.cargarPrestamos();
      this.toggleFormulario();
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
    Swal.fire({
      title: '¿Confirmar devolución?',
      text: `El equipo ${prestamo.nombre} será marcado como devuelto`,
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
            this.cargarPrestamos();
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
