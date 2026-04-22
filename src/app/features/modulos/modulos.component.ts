import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Modulo, ModulosService } from '../../core/services/modulos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modulos',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './modulos.component.html',
  styleUrls: ['./modulos.component.css']
})
export class ModulosComponent {

  modulos: Modulo[] = [];
  modulosFiltrados: Modulo[] = [];
  filtro: string = '';
  mostrarFormulario: boolean = false;
  editando: boolean = false;

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 4;

  nuevoModulo: any = {
    id: 0,
    nombre: '',
    ruta: '',
    icon: '',
    estado: 1
  };

  constructor(private modulosService: ModulosService) { }

  ngOnInit(): void {
    this.cargarModulos();
  }

  cargarModulos() {
    this.modulosService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
        console.log(data)
        this.aplicarFiltro();
      },
      error: (err: any) => console.error("Error al obtener módulos", err)
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.modulosFiltrados = texto
      ? this.modulos.filter(m => m.nombre.toLowerCase().includes(texto))
      : this.modulos;

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.modulosFiltrados.length / this.registrosPorPagina);
  }

  get modulosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.modulosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.nuevoModulo = { id: 0, nombre: '', ruta: '', icon: '', estado: 1 };
      this.editando = false;
    }
  }

  guardarModulo() {
    if (this.editando) {
      this.modulosService.updateModulo(this.nuevoModulo.id, this.nuevoModulo).subscribe({
        next: () => {
          this.cargarModulos();
          this.toggleFormulario();
          Swal.fire('¡Actualizado!', 'Módulo actualizado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el módulo.', 'error')
      });
    } else {
      this.modulosService.addModulo(this.nuevoModulo).subscribe({
        next: () => {
          this.cargarModulos();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Módulo agregado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo agregar el módulo.', 'error')
      });
    }
  }

  editarModulo(modulo: any) {
    this.nuevoModulo = { ...modulo };
    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarModulo(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.modulosService.deleteModulo(id).subscribe({
          next: () => {
            this.modulos = this.modulos.filter(m => m.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'El módulo ha sido eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el módulo.', 'error')
        });
      }
    });
  }

}