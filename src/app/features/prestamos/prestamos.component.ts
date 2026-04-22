import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prestamos',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './prestamos.component.html',
  styleUrls: ['./prestamos.component.css']
})
export class PrestamoComponent implements OnInit {
  filtro: string = '';
  mostrarFormulario = false;

  // Lista de ejemplo basada en tu imagen
  prestamos: any[] = [
    { id: 1, articulo: 'Laptop Dell Latitude', solicitante: 'Prof. Carlos Ruiz', fechaPrestamo: '2025-03-20', fechaDevolucion: '2025-03-27', estado: 'ACTIVO' },
    { id: 2, articulo: 'Proyector Epson', solicitante: 'Ing. Ana Belén', fechaPrestamo: '2025-03-15', fechaDevolucion: '2025-03-16', estado: 'DEVUELTO' }
  ];

  prestamosFiltrados: any[] = [];

  // Objeto para el nuevo préstamo
  nuevoPrestamo = {
    articulo: '',
    solicitante: '',
    fechaPrestamo: new Date().toISOString().split('T')[0],
    fechaDevolucion: ''
  };

  // Simulación de artículos para el select
  articulosDisponibles = [
    { id: 1, nombre: 'Laptop Dell Latitude (FISI-001)' },
    { id: 2, nombre: 'Proyector Epson (LAB-02)' },
    { id: 3, nombre: 'Cámara Canon (EXT-05)' }
  ];

  ngOnInit(): void {
    this.prestamosFiltrados = [...this.prestamos];
  }

  aplicarFiltro() {
    const texto = this.filtro.toLowerCase();
    this.prestamosFiltrados = this.prestamos.filter(p =>
      p.articulo.toLowerCase().includes(texto) ||
      p.solicitante.toLowerCase().includes(texto)
    );
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevoPrestamo = { articulo: '', solicitante: '', fechaPrestamo: new Date().toISOString().split('T')[0], fechaDevolucion: '' };
    }
  }

  registrarPrestamo() {
    const p = {
      ...this.nuevoPrestamo,
      id: this.prestamos.length + 1,
      estado: 'ACTIVO'
    };
    this.prestamos.unshift(p);
    this.aplicarFiltro();
    this.toggleFormulario();
    Swal.fire('¡Registrado!', 'El préstamo se ha creado con éxito.', 'success');
  }

  marcarDevuelto(id: number) {
    const index = this.prestamos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.prestamos[index].estado = 'DEVUELTO';
      Swal.fire('Actualizado', 'Equipo marcado como devuelto', 'success');
    }
  }
}