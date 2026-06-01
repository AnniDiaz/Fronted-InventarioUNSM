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

@Component({
  selector: 'app-mantenimiento',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule, NgxPaginationModule],
  templateUrl: './mantenimiento.component.html',
  styleUrls: ['./mantenimiento.component.css']
})
export class MantenimientoComponent implements OnInit {

  p: number = 1;
  menuAbierto = false;
  mostrarFormulario = false;

  mantenimientos: any[] = [];
  mantenimientosFiltrados: any[] = [];
  articulosDisponibles: any[] = [];
  editando = false;
  idMantenimientoEditar: number | null = null;

  filtroTexto: string = '';
  filtroFecha: string = '';

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
  this.cargarUbicaciones();
}
cargarUbicaciones(): void {

  const usuario = JSON.parse(localStorage.getItem('user') || 'null');
  const usuarioId = usuario?.data?.id;

  if (!usuarioId) return;

 this.ubicacionService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (resp: any) => {

      const ubicaciones = Array.isArray(resp) ? resp : resp?.data ?? [];

      if (!ubicaciones.length) return;

      const padreId = ubicaciones[0].id;

      this.ubicacionService.getUbicacionesPorPadre(padreId).subscribe({
        next: (res: any) => {

          this.listaUbicaciones = Array.isArray(res) ? res : res?.data ?? [];

          // 🔥 IMPORTANTE: IDs permitidos
          this.idsUbicacionesPermitidas = this.listaUbicaciones.map(u => u.id);

          // 🔥 ahora sí cargar todo
          this.cargarArticulosParaSelect();
          this.cargarMantenimientos();
        }
      });

    }
  });
}
cargarArticulosParaSelect(): void {
  this._articuloService.getArticulos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res) ? res : res?.data ?? [];

   this.articulosDisponibles = data.filter((a: any) =>
  this.idsUbicacionesPermitidas.includes(a.ubicacionId)
);
    }
  });
}
cargarMantenimientos(): void {
  this._mantenimientoService.getMantenimientos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res) ? res : res?.data ?? [];

      this.mantenimientos = data.filter((m: any) => {

        const articulo = this.articulosDisponibles.find(
          a => a.id === m.articuloId
        );

        if (!articulo) return false;

        return this.idsUbicacionesPermitidas.includes(articulo.ubicacionId);
      });

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

  const mensaje =
    err?.error?.Errors ||   // 👈 ESTE ES EL CORRECTO
    err?.error?.Message ||
    'Hubo un problema al procesar la solicitud.';

  Swal.fire('Atención', mensaje, 'warning');
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
    if (!this.mostrarFormulario) {
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