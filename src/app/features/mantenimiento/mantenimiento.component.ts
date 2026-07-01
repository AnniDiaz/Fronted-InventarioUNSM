import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MantenimientoService } from '../../core/services/mantenimiento.service'; // Ajusta la ruta real
import Swal from 'sweetalert2';
import { ArticuloService } from '../../core/services/articulos.service';
import { NgxPaginationModule } from 'ngx-pagination';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
@Component({
  selector: 'app-mantenimiento',
imports: [
  HeaderComponent,
  SidebarComponent,
  FormsModule,
  CommonModule,
  NgxPaginationModule,
  MatAutocompleteModule,
  MatInputModule,
  MatFormFieldModule
],  templateUrl: './mantenimiento.component.html',
  styleUrls: ['./mantenimiento.component.css']
})
export class MantenimientoComponent implements OnInit {

  p: number = 1;
  menuAbierto = false;
  mostrarFormulario = false;
busquedaArticulo: string = '';
articulosFiltradosSelect: any[] = [];
  mantenimientos: any[] = [];
  mantenimientosFiltrados: any[] = [];
  articulosDisponibles: any[] = [];
  editando = false;
  idMantenimientoEditar: number | null = null;

articulosFiltrados: any[] = [];
  filtroTexto: string = '';
  filtroFecha: string = '';
mostrarListaArticulos = false;
  // Paginación manual para match con Artículos
  paginaActual = 1;
  pageSize = 6;
  totalPaginas = 1;
  registrosPaginados: any[] = [];
listaUbicaciones: any[] = [];
idsUbicacionesPermitidas: number[] = [];
  nuevoMantenimiento = {
    idArticulo: '',
    tipo: 'Preventivo',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    costo: 0,
    observaciones: ''
  };

  constructor(private _mantenimientoService: MantenimientoService, private _articuloService: ArticuloService,
    private ubicacionService:UbicacionService
  ) { }

ngOnInit(): void {
  if (this.esAdministrador()) {
    this.cargarArticulosSinFiltro();
  } else {
    this.cargarPorEscuela();
  }
}

cargarPorEscuela(): void {
  const escuelaId = Number(localStorage.getItem('escuelaId'));

  if (!escuelaId) {
    this.cargarUbicaciones();
    return;
  }

  this._articuloService.getArticulosPorEscuela(escuelaId).subscribe({
    next: (res: any) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      this.articulosDisponibles = data;
      this.articulosFiltradosSelect = [...data];
      this.cargarMantenimientos();
    },
    error: (err) => console.error(err)
  });
}

esAdministrador(): boolean {
  return Number(localStorage.getItem('rolId')) === 1;
}
cargarUbicaciones(): void {

  const usuario = JSON.parse(localStorage.getItem('user') || '{}');

  const usuarioId =
    usuario?.data?.id ||
    usuario?.id ||
    usuario?.usuarioId;

  if (!usuarioId) {
    console.error('No se encontró usuario');
    return;
  }

  this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (resp: any) => {

      const ubicacionesUsuario = Array.isArray(resp)
        ? resp
        : resp?.data ?? [];

      if (ubicacionesUsuario.length === 0) {
        this.articulosDisponibles = [];
        return;
      }

      const ubicacionPadreId = Number(ubicacionesUsuario[0].id);

      this.ubicacionService.getUbicacionesPorPadre(ubicacionPadreId).subscribe({
        next: (res: any) => {

          this.listaUbicaciones = Array.isArray(res)
            ? res
            : res?.data ?? [];

          this.idsUbicacionesPermitidas = [
            ubicacionPadreId,
            ...this.listaUbicaciones.map((u: any) => Number(u.id))
          ];

          console.log('IDS PERMITIDOS:', this.idsUbicacionesPermitidas);

          // SOLO CARGAMOS ARTÍCULOS
          // LOS MANTENIMIENTOS SE CARGARÁN DESPUÉS
          this.cargarArticulosParaSelect();

        },
        error: (err) => {
          console.error(err);
        }
      });

    },
    error: (err) => {
      console.error(err);
    }
  });
}
cargarArticulosSinFiltro(): void {
  this._articuloService.getArticulosConCampos().subscribe({
    next: (res: any) => {
      const data = Array.isArray(res) ? res : res?.data ?? [];
      this.articulosDisponibles = data;
      this.articulosFiltradosSelect = [...data];
      this.cargarMantenimientos();
    },
    error: (err) => console.error(err)
  });
}

cargarArticulosParaSelect(): void {

  this._articuloService.getArticulosConCampos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res)
        ? res
        : res?.data ?? [];

      this.articulosDisponibles = data.filter((a: any) =>
        this.idsUbicacionesPermitidas.includes(Number(a.ubicacionId))
      );

      this.articulosFiltradosSelect = [...this.articulosDisponibles];

      console.log('ARTICULOS DISPONIBLES:', this.articulosDisponibles);

      // IMPORTANTE:
      // AHORA LOS MANTENIMIENTOS SE CARGAN
      // CUANDO LOS ARTÍCULOS YA EXISTEN
      this.cargarMantenimientos();

    },
    error: (err) => {
      console.error(err);
    }
  });

}
filtrarArticulos() {

  const texto = this.busquedaArticulo.toLowerCase();

  this.articulosFiltrados = this.articulosDisponibles.filter(a =>
    a.nombre.toLowerCase().includes(texto) ||
    a.codigoPatrimonial.toLowerCase().includes(texto)
  );
}

filtrarArticulosSelect(): void {

  this.mostrarListaArticulos = true;

  const texto = this.busquedaArticulo.toLowerCase().trim();

  if (!texto) {
    this.articulosFiltradosSelect = [...this.articulosDisponibles];
    return;
  }

  this.articulosFiltradosSelect = this.articulosDisponibles.filter(a =>
    (a.nombre || '').toLowerCase().includes(texto) ||
    (a.codigoPatrimonial || '').toLowerCase().includes(texto)
  );
}
eliminarMantenimiento(mantenimiento: any): void {

  const id =
    mantenimiento.id ||
    mantenimiento.idMantenimiento;

  Swal.fire({
    title: '¿Eliminar mantenimiento?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {

    if (result.isConfirmed) {

      this._mantenimientoService.deleteMantenimiento(id)
        .subscribe({
          next: () => {

            Swal.fire(
              'Eliminado',
              'El mantenimiento fue eliminado correctamente.',
              'success'
            );

            this.cargarMantenimientos();
          },
          error: (err) => {
            console.error(err);

            Swal.fire(
              'Error',
              'No se pudo eliminar el mantenimiento.',
              'error'
            );
          }
        });

    }

  });

}
seleccionarArticulo(articulo: any): void {

  this.nuevoMantenimiento.idArticulo = articulo.id;

  this.busquedaArticulo =
    articulo.codigoPatrimonial + ' - ' + articulo.nombre;

  this.articulosFiltradosSelect = [];
  this.mostrarListaArticulos = false;
}
cargarMantenimientos(): void {

  console.log('ARTICULOS CARGADOS:', this.articulosDisponibles.length);

  this._mantenimientoService.getMantenimientos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res) ? res : res?.data ?? [];

      if (this.esAdministrador()) {
        this.mantenimientos = data;
      } else {
        const idsPermitidos = new Set(this.articulosDisponibles.map((a: any) => Number(a.id)));
        this.mantenimientos = data.filter((m: any) => idsPermitidos.has(Number(m.articuloId)));
      }

      this.aplicarFiltro();
    },
    error: (err) => {
      console.error('Error al cargar mantenimientos', err);
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
    }
  });
}
  programarMantenimiento(): void {
    console.log("--- INICIO REGISTRO MANTENIMIENTO ---");

    // 1. Validación de seguridad
    if (!this.nuevoMantenimiento.idArticulo || !this.nuevoMantenimiento.fecha) {
      Swal.fire('Atención', 'Selecciona un artículo y una fecha válida.', 'warning');
      return;
    }

    try {
      // 2. Construcción del Payload Limpio
      // Ajustamos los nombres para que coincidan con los DTOs típicos de C# (PascalCase)
      const payload = {
        Id: this.editando ? this.idMantenimientoEditar : 0,
        ArticuloId: Number(this.nuevoMantenimiento.idArticulo),
        TipoMantenimiento: this.nuevoMantenimiento.tipo,
        FechaMantenimiento: new Date(this.nuevoMantenimiento.fecha).toISOString(),
        ProveedorServicion: this.nuevoMantenimiento.proveedor,
        Costo: 0,
        Observaciones: this.nuevoMantenimiento.observaciones,
        EstadoMantenimiento: true // Se mantiene pendiente si se edita
      };

      console.log("🚀 Enviando a API:", payload);

      const request = this.editando
        ? this._mantenimientoService.updateEstadoMantenimiento(this.idMantenimientoEditar!, payload)
        : this._mantenimientoService.addMantenimiento(payload);

      request.subscribe({
        next: (res) => {
          Swal.fire('Éxito', this.editando ? 'Mantenimiento actualizado' : 'Mantenimiento registrado', 'success');
          this.cargarMantenimientos();
          this.toggleFormulario();
        },
error: (err) => {
  console.error("Error completo:", err);

  let mensaje = 'Hubo un problema al procesar la solicitud.';

  if (typeof err.error === 'string') {

    const match = err.error.match(/System\.Exception:\s*(.*?)(\r\n|\n|$)/);

    if (match && match[1]) {
      mensaje = match[1];
    } else {
      mensaje = err.error;
    }

  } else if (err.error?.Errors) {
    mensaje = err.error.Errors;
  } else if (err.error?.Message) {
    mensaje = err.error.Message;
  }

  Swal.fire({
    icon: 'warning',
    title: 'Atención',
    text: mensaje
  });
}
      });

    } catch (error) {
      console.error("💥 Error antes de enviar:", error);
      Swal.fire('Error', 'Formato de fecha inválido', 'error');
    }
  }

  prepararEdicion(mantenimiento: any): void {
    this.editando = true;
    this.idMantenimientoEditar = mantenimiento.id || mantenimiento.idMantenimiento;
    this.nuevoMantenimiento = {
      idArticulo: mantenimiento.articuloId.toString(),
      tipo: mantenimiento.tipoMantenimiento,
      fecha: mantenimiento.fechaMantenimiento ? mantenimiento.fechaMantenimiento.split('T')[0] : '',
      proveedor: mantenimiento.proveedorServicion,
      costo: 0,
      observaciones: mantenimiento.observaciones
    };
    this.mostrarFormulario = true;
  }

  marcarCompletado(mantenimiento: any): void {
    // DEPUREMOS: Mira qué tiene el objeto realmente
    console.log("Objeto mantenimiento recibido:", mantenimiento);

    if (!mantenimiento || (mantenimiento.id === undefined && mantenimiento.idMantenimiento === undefined)) {
      Swal.fire('Error', 'No se encontró el ID del mantenimiento', 'error');
      return;
    }

    Swal.fire({
      title: '¿Confirmar mantenimiento?',
      text: `El mantenimiento será marcado como completado`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, completado',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        // Intentamos capturar el ID ya sea 'id' o 'idMantenimiento'
        const idFinal = mantenimiento.id || mantenimiento.idMantenimiento;

        const updateData = {
          Id: idFinal, // <--- Aquí ya no será undefined
          ArticuloId: mantenimiento.articuloId,
          Observaciones: mantenimiento.observaciones,
          TipoMantenimiento: mantenimiento.tipoMantenimiento,
          FechaMantenimiento: mantenimiento.fechaMantenimiento,
          ProveedorServicion: mantenimiento.proveedorServicion,
          Costo: 0,
          Estado: true,
          EstadoMantenimiento: false
        };

        this._mantenimientoService.updateEstadoMantenimiento(idFinal, updateData).subscribe({
          next: () => {
            Swal.fire('Actualizado', 'Mantenimiento finalizado', 'success');
            this.cargarMantenimientos();
          },
          error: (err) => {
            console.error("Payload enviado:", updateData);
            console.error("Error detallado:", err.error);
            Swal.fire('Error', 'Fallo en la validación del servidor', 'error');
          }
        });
      }
    });
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }
toggleFormulario(): void {

  this.mostrarFormulario = !this.mostrarFormulario;
if (this.mostrarFormulario) {

  this.busquedaArticulo = '';

  // NO mostrar lista al abrir
  this.articulosFiltradosSelect = [];

  this.mostrarListaArticulos = false;
} else {

  this.busquedaArticulo = '';
  this.articulosFiltradosSelect = [];
  this.mostrarListaArticulos = false;

  this.editando = false;
  this.idMantenimientoEditar = null;

  this.nuevoMantenimiento = {
    idArticulo: '',
    tipo: 'Preventivo',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    costo: 0,
    observaciones: ''
  };
}
}
  aplicarFiltro(): void {
    const texto = this.filtroTexto.toLowerCase();

    this.mantenimientosFiltrados = this.mantenimientos.filter(m => {
      const cumpleTexto = !texto ||
        (m.articulo?.codigoPatrimonial?.toLowerCase().includes(texto)) ||
        (m.tipoMantenimiento?.toLowerCase().includes(texto)) ||
        (m.proveedorServicion?.toLowerCase().includes(texto));

      const cumpleFecha = !this.filtroFecha ||
        (m.fechaMantenimiento && m.fechaMantenimiento.split('T')[0] === this.filtroFecha);

      return cumpleTexto && cumpleFecha;
    });

    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.mantenimientosFiltrados.length / this.pageSize);
    if (this.paginaActual > this.totalPaginas) this.paginaActual = 1;

    const inicio = (this.paginaActual - 1) * this.pageSize;
    const fin = inicio + this.pageSize;
    this.registrosPaginados = this.mantenimientosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(nueva: number): void {
    if (nueva >= 1 && nueva <= this.totalPaginas) {
      this.paginaActual = nueva;
      this.actualizarPaginacion();
    }
  }
}
