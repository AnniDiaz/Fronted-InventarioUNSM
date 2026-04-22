import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mantenimiento',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './mantenimiento.component.html',
  styleUrls: ['./mantenimiento.component.css']
})
export class MantenimientoComponent implements OnInit {

  // Variables para la responsividad del menú
  menuAbierto = false;

  mostrarFormulario = false;
  filtro: string = '';

  // Datos de ejemplo basados en tu imagen
  mantenimientos: any[] = [
    { id: 1, articulo: 'Proyector Epson', tipo: 'Correctivo', fecha: '2025-03-10', proveedor: 'TecnoService', costo: 150, estado: 'COMPLETADO' },
    { id: 2, articulo: 'Laptop Dell Latitude', tipo: 'Preventivo', fecha: '2025-04-05', proveedor: 'Dell Support', costo: 0, estado: 'PENDIENTE' }
  ];

  mantenimientosFiltrados: any[] = [];

  // Objeto para el formulario
  nuevoMantenimiento = {
    articulo: '',
    tipo: 'Preventivo',
    fecha: new Date().toISOString().split('T')[0],
    proveedor: '',
    costo: 0
  };

  // Lista de artículos para el select
  articulosDisponibles = [
    { id: 1, nombre: 'Proyector Epson' },
    { id: 2, nombre: 'Laptop Dell Latitude' },
    { id: 3, nombre: 'Impresora HP Laser' }
  ];

  ngOnInit(): void {
    this.mantenimientosFiltrados = [...this.mantenimientos];
  }

  // Lógica para abrir/cerrar el menú lateral
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevoMantenimiento = { articulo: '', tipo: 'Preventivo', fecha: new Date().toISOString().split('T')[0], proveedor: '', costo: 0 };
    }
  }

  programarMantenimiento() {
    const m = {
      ...this.nuevoMantenimiento,
      id: this.mantenimientos.length + 1,
      estado: 'PENDIENTE'
    };
    this.mantenimientos.unshift(m);
    this.mantenimientosFiltrados = [...this.mantenimientos];
    this.toggleFormulario();
    Swal.fire('¡Programado!', 'El mantenimiento ha sido registrado.', 'success');
  }

  marcarCompletado(id: number) {
    const index = this.mantenimientos.findIndex(m => m.id === id);
    if (index !== -1) {
      this.mantenimientos[index].estado = 'COMPLETADO';
      Swal.fire('¡Éxito!', 'Mantenimiento marcado como completado.', 'success');
    }
  }
}