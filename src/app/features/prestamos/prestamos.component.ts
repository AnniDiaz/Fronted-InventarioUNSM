import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { PrestamosService } from '../../core/services/prestamos.service';
import { ArticuloService } from '../../core/services/articulos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './prestamos.component.html',
  styleUrls: ['./prestamos.component.css']
})
export class PrestamoComponent implements OnInit {

  // --- Propiedades para el Layout Responsivo ---
  menuAbierto = false; // Controla si el menú lateral se muestra en móviles

  // --- Datos ---
  prestamos: any[] = [];
  prestamosFiltrados: any[] = [];
  articulosDisponibles: any[] = [];

  mostrarFormulario = false;
  filtro: string = '';

  nuevoPrestamo: any = {
    ArticuloId: null,
    NombreSolicitante: '',
    FechaPrestamo: new Date().toISOString().split('T')[0],
    FechaDevolucion: '',
  };

  constructor(
    private _prestamosService: PrestamosService,
    private _articulosService: ArticuloService
  ) { }

  ngOnInit(): void {
    this.cargarPrestamos();
    this.cargarArticulosDisponibles();
  }

  // --- Lógica del Menú Hamburguesa ---
  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  // --- Lógica de Negocio ---
cargarPrestamos() {
  this._prestamosService.getPrestamos().subscribe({
    next: (res) => {
      this.prestamos = res.data;           // ✅ AQUÍ ESTÁ EL FIX
      this.prestamosFiltrados = res.data;  // ✅
    },
    error: (err) => {
      console.error('Error al cargar préstamos', err);
      Swal.fire('Error', 'No se pudieron cargar los préstamos', 'error');
    }
  });
}
cargarArticulosDisponibles() {
  this._articulosService.getArticulos().subscribe({
    next: (res) => {
      this.articulosDisponibles = res.data; // ✅ ahora sí existe
    }
  });
}getNombreArticulo(id: number) {
  const articulo = this.articulosDisponibles.find(a => a.id === id);
  return articulo ? articulo.nombre : 'Desconocido';
}
  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.prestamosFiltrados = this.prestamos.filter(p =>
      (p.nombreArticulo?.toLowerCase().includes(texto)) ||
      (p.solicitante?.toLowerCase().includes(texto))
    );
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

  try {

    const dataParaEnviar: any = {
      ArticuloId: Number(this.nuevoPrestamo.ArticuloId),
      NombreSolicitante: this.nuevoPrestamo.NombreSolicitante,
      FechaPrestamo: new Date(this.nuevoPrestamo.FechaPrestamo).toISOString(),
      Estado: 1,
      EstadoPrestamo: true
    };

    this._prestamosService.addPrestamo(dataParaEnviar).subscribe({
      next: () => {
        Swal.fire('¡Registrado!', 'El préstamo se ha creado con éxito.', 'success');
        this.cargarPrestamos();
        this.toggleFormulario();
      },
      error: (err) => {
        console.error("Error en la petición:", err);
        Swal.fire('Error', 'Hubo un fallo al registrar. Revisa los datos.', 'error');
      }
    });

  } catch (e) {
    Swal.fire('Error', 'Ocurrió un error al procesar los datos.', 'error');
  }
}
   marcarDevuelto(prestamo: any) {
    Swal.fire({
      title: '¿Confirmar devolución?',
      text: `El equipo ${prestamo.nombreArticulo} será marcado como devuelto`,
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
          Estado: 0,
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
}
