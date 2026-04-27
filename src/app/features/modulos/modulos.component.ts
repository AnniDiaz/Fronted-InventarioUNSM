import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { Modulo, ModulosService } from '../../core/services/modulos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-modulos',
  standalone: true,
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

  paginaActual: number = 1;
  registrosPorPagina: number = 6;

  modalSubmodulos: boolean = false;
  moduloSeleccionado: any = null;

  openSubmodulos: number[] = [];

  nuevoModulo: any = {
    id: 0,
    nombre: '',
    ruta: '',
    icon: '',
    estado: 1
  };

  constructor(private modulosService: ModulosService) {}

  ngOnInit(): void {
    this.cargarModulos();
  }

  cargarModulos() {
    this.modulosService.getModulos().subscribe({
      next: (resp: any) => {
        if (!resp?.success || !Array.isArray(resp.data)) {
          this.modulos = [];
          this.modulosFiltrados = [];
          return;
        }

        // 🔥 NORMALIZAR
        this.modulos = resp.data.map((m: any) => ({
          ...m,
          subModulos: m.subModulos || []
        }));

        this.aplicarFiltro();
      },
      error: () => {
        this.modulos = [];
        this.modulosFiltrados = [];
      }
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();

    this.modulosFiltrados = texto
      ? this.modulos.filter(m => m.nombre.toLowerCase().includes(texto))
      : this.modulos;

    this.paginaActual = 1;
  }

  toggleSubmodulos(moduloId: number) {
    if (this.openSubmodulos.includes(moduloId)) {
      this.openSubmodulos = this.openSubmodulos.filter(id => id !== moduloId);
    } else {
      this.openSubmodulos.push(moduloId);
    }
  }

  isOpen(moduloId: number): boolean {
    return this.openSubmodulos.includes(moduloId);
  }

  abrirSubmodulos(modulo: any) {
    this.moduloSeleccionado = modulo;
    this.modalSubmodulos = true;
  }

  cerrarModal() {
    this.modalSubmodulos = false;
    this.moduloSeleccionado = null;
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
      this.modulosService.updateModulo(this.nuevoModulo.id, this.nuevoModulo)
        .subscribe(() => {
          this.cargarModulos();
          this.toggleFormulario();
          Swal.fire('OK', 'Actualizado correctamente', 'success');
        });
    } else {
      this.modulosService.addModulo(this.nuevoModulo)
        .subscribe(() => {
          this.cargarModulos();
          this.toggleFormulario();
          Swal.fire('OK', 'Agregado correctamente', 'success');
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
      title: '¿Eliminar módulo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí'
    }).then(result => {
      if (result.isConfirmed) {
        this.modulosService.deleteModulo(id).subscribe(() => {
          this.modulos = this.modulos.filter(m => m.id !== id);
          this.aplicarFiltro();
          Swal.fire('Eliminado', '', 'success');
        });
      }
    });
  }
}
