import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { MantenimientoService } from '../../core/services/mantenimiento.service'; // Ajusta la ruta real
import Swal from 'sweetalert2';
import { ArticuloService } from '../../core/services/articulos.service';
import { NgxPaginationModule } from 'ngx-pagination';

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

  filtroTexto: string = '';
  filtroFecha: string = '';

  // Paginación manual para match con Artículos
  paginaActual = 1;
  pageSize = 6;
  totalPaginas = 1;
  registrosPaginados: any[] = [];

  nuevoMantenimiento = {
    idArticulo: '',
    tipo: 'Preventivo',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    costo: 0
  };

  constructor(private _mantenimientoService: MantenimientoService, private _articuloService: ArticuloService) { }

  ngOnInit(): void {
    this.cargarArticulosParaSelect();
    this.cargarMantenimientos();
  }

  cargarArticulosParaSelect(): void {
    this._articuloService.getArticulos().subscribe({
      next: (res: any) => {
        // Manejamos el wrapper ApiResponse { success, message, data }
        this.articulosDisponibles = Array.isArray(res) ? res : res?.data ?? [];
      },
      error: (err) => {
        console.error('Error al cargar artículos', err);
      }
    });
  }

  cargarMantenimientos(): void {
    this._mantenimientoService.getMantenimientos().subscribe({
      next: (data) => {
        console.log(data);
        this.mantenimientos = data;
        this.mantenimientosFiltrados = [...this.mantenimientos];
        this.actualizarPaginacion();
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
        ArticuloId: Number(this.nuevoMantenimiento.idArticulo),
        TipoMantenimiento: this.nuevoMantenimiento.tipo,
        // Forzamos formato ISO completo para evitar el Error 400 de DateTime
        FechaMantenimiento: new Date(this.nuevoMantenimiento.fecha).toISOString(),
        ProveedorServicion: this.nuevoMantenimiento.proveedor,
        Costo: Number(this.nuevoMantenimiento.costo),
        Estado: 'PENDIENTE' // O el valor inicial que use tu lógica
      };

      console.log("🚀 Enviando a API:", payload);

      this._mantenimientoService.addMantenimiento(payload).subscribe({
        next: (res) => {
          console.log("✅ Servidor respondió:", res);
          Swal.fire('¡Programado!', 'El mantenimiento ha sido registrado.', 'success');
          this.cargarMantenimientos();
          this.toggleFormulario();
        },
        error: (err) => {
          console.group("❌ ERROR EN MANTENIMIENTO");
          console.error("Status:", err.status);
          console.error("Detalles:", err.error);

          // Si el error es 400, imprimimos los campos que .NET rechaza
          if (err.status === 400 && err.error?.errors) {
            console.table(err.error.errors);
          }
          console.groupEnd();

          Swal.fire('Error', 'Hubo un problema al registrar. Revisa la consola.', 'error');
        }
      });

    } catch (error) {
      console.error("💥 Error antes de enviar:", error);
      Swal.fire('Error', 'Formato de fecha inválido', 'error');
    }
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
          TipoMantenimiento: mantenimiento.tipoMantenimiento,
          FechaMantenimiento: mantenimiento.fechaMantenimiento,
          ProveedorServicion: mantenimiento.proveedorServicion,
          Costo: mantenimiento.costo,
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
      this.nuevoMantenimiento = {
        idArticulo: '',
        tipo: 'Preventivo',
        fecha: new Date().toISOString().split('T')[0],
        proveedor: '',
        costo: 0
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