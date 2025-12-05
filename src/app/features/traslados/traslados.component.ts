import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-traslados',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './traslados.component.html',
  styleUrls: ['./traslados.component.css']
})
export class TrasladosComponent {
  mostrarFormulario: boolean = false;
  editando: boolean = false;
  filtro: string = '';

  listaArticulos = [
    { id: 1, nombre: 'Laptop Lenovo' },
    { id: 2, nombre: 'Mouse Inalámbrico' },
    { id: 3, nombre: 'Teclado Mecánico' }
  ];

  listaUbicaciones = [
    { id: 1, nombre: 'Almacén Central' },
    { id: 2, nombre: 'Sucursal Norte' },
    { id: 3, nombre: 'Sucursal Sur' }
  ];

  traslados: any[] = [
    {
      id: 1,
      articuloNombre: 'Laptop Lenovo',
      cantidad: 5,
      origenNombre: 'Almacén Central',
      destinoNombre: 'Sucursal Norte',
      fecha: '2025-10-15',
      observaciones: 'Entrega urgente'
    },
    {
      id: 2,
      articuloNombre: 'Mouse Inalámbrico',
      cantidad: 10,
      origenNombre: 'Sucursal Sur',
      destinoNombre: 'Almacén Central',
      fecha: '2025-10-20',
      observaciones: ''
    }
  ];

  nuevoTraslado: any = {
    articulo: '',
    cantidad: null,
    origen: '',
    destino: '',
    fecha: '',
    observaciones: ''
  };

  trasladoSeleccionado: any = null;
  paginaActual: number = 1;
  registrosPorPagina: number = 5;

  get totalPaginas(): number {
    return Math.ceil(this.filtrarTraslados().length / this.registrosPorPagina);
  }

  get registrosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.filtrarTraslados().slice(inicio, inicio + this.registrosPorPagina);
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
  }

  aplicarFiltro(): void {
    this.paginaActual = 1;
  }

  filtrarTraslados(): any[] {
    const texto = this.filtro.toLowerCase();
    return this.traslados.filter(t =>
      t.articuloNombre.toLowerCase().includes(texto) ||
      t.origenNombre.toLowerCase().includes(texto) ||
      t.destinoNombre.toLowerCase().includes(texto)
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  guardarTraslado(): void {
    if (this.editando) {
      this.actualizarTraslado();
      Swal.fire('¡Actualizado!', 'El traslado fue actualizado correctamente.', 'success');
    } else {
      this.registrarTraslado();
      Swal.fire('¡Agregado!', 'El traslado fue registrado correctamente.', 'success');
    }
    this.toggleFormulario();
  }

  registrarTraslado(): void {
    const articulo = this.listaArticulos.find(a => a.id == this.nuevoTraslado.articulo);
    const origen = this.listaUbicaciones.find(u => u.id == this.nuevoTraslado.origen);
    const destino = this.listaUbicaciones.find(u => u.id == this.nuevoTraslado.destino);

    const nuevo = {
      id: this.traslados.length + 1,
      articuloNombre: articulo?.nombre || '',
      cantidad: this.nuevoTraslado.cantidad,
      origenNombre: origen?.nombre || '',
      destinoNombre: destino?.nombre || '',
      fecha: this.nuevoTraslado.fecha,
      observaciones: this.nuevoTraslado.observaciones || ''
    };

    this.traslados.push(nuevo);
    this.limpiarFormulario();
  }

  editarTraslado(traslado: any): void {
    this.editando = true;
    this.mostrarFormulario = true;
    this.trasladoSeleccionado = traslado;

    const articulo = this.listaArticulos.find(a => a.nombre === traslado.articuloNombre);
    const origen = this.listaUbicaciones.find(u => u.nombre === traslado.origenNombre);
    const destino = this.listaUbicaciones.find(u => u.nombre === traslado.destinoNombre);

    this.nuevoTraslado = {
      articulo: articulo?.id,
      cantidad: traslado.cantidad,
      origen: origen?.id,
      destino: destino?.id,
      fecha: traslado.fecha,
      observaciones: traslado.observaciones
    };
  }

  actualizarTraslado(): void {
    if (!this.trasladoSeleccionado) return;

    const articulo = this.listaArticulos.find(a => a.id == this.nuevoTraslado.articulo);
    const origen = this.listaUbicaciones.find(u => u.id == this.nuevoTraslado.origen);
    const destino = this.listaUbicaciones.find(u => u.id == this.nuevoTraslado.destino);

    this.trasladoSeleccionado.articuloNombre = articulo?.nombre || '';
    this.trasladoSeleccionado.cantidad = this.nuevoTraslado.cantidad;
    this.trasladoSeleccionado.origenNombre = origen?.nombre || '';
    this.trasladoSeleccionado.destinoNombre = destino?.nombre || '';
    this.trasladoSeleccionado.fecha = this.nuevoTraslado.fecha;
    this.trasladoSeleccionado.observaciones = this.nuevoTraslado.observaciones || '';

    this.editando = false;
    this.limpiarFormulario();
  }

  eliminarTraslado(id: number): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esta acción!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.traslados = this.traslados.filter(t => t.id !== id);
        Swal.fire('¡Eliminado!', 'El traslado ha sido eliminado.', 'success');
      }
    });
  }

  limpiarFormulario(): void {
    this.nuevoTraslado = {
      articulo: '',
      cantidad: null,
      origen: '',
      destino: '',
      fecha: '',
      observaciones: ''
    };
    this.trasladoSeleccionado = null;
    this.editando = false;
  }
}
