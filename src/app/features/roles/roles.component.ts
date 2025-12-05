import { Component, ChangeDetectorRef } from '@angular/core';
import { RolesService } from '../../core/services/roles.service';
import { ModulosService } from '../../core/services/modulos.service';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-roles',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent {

  filtro: string = '';
  roles: any[] = [];
  rolesFiltrados: any[] = [];

  mostrarFormulario: boolean = false;
  editando: boolean = false;

  paginaActual: number = 1;
  registrosPorPagina: number = 12;

  modulos: any[] = [];
  subModulosSeleccionados: number[] = [];

  nuevoRol = {
    id: 0,
    nombre: '',
    estado: 1
  };

  constructor(
    private rolesService: RolesService,
    private modulosService: ModulosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarModulos();
  }

  cargarRoles() {
    this.rolesService.getRoles().subscribe({
      next: (data: any[]) => {
        this.roles = data;
        this.aplicarFiltro();
      },
      error: (err) => console.error("Error al obtener roles", err)
    });
  }

  cargarModulos() {
    this.modulosService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data.map(m => ({ ...m, expandido: false }));
      },
      error: (err) => console.error("Error al cargar módulos", err)
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.rolesFiltrados = texto
      ? this.roles.filter(r => r.nombre.toLowerCase().includes(texto))
      : this.roles;
    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.rolesFiltrados.length / this.registrosPorPagina);
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.rolesFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) {
      this.nuevoRol = { id: 0, nombre: '', estado: 1 };
      this.subModulosSeleccionados = [];
      this.editando = false;
    } else if (!this.editando) {
      this.subModulosSeleccionados = [];
    }
  }

  toggleSubModulo(id: number, event: any) {
    if (event.target.checked) {
      if (!this.subModulosSeleccionados.includes(id)) {
        this.subModulosSeleccionados.push(id);
      }
    } else {
      this.subModulosSeleccionados = this.subModulosSeleccionados.filter(x => x !== id);
    }
  }

  toggleModuloCompleto(modulo: any, event: any) {
    if (event.target.checked) {
      modulo.subModulos.forEach((s: any) => {
        if (!this.subModulosSeleccionados.includes(s.id)) {
          this.subModulosSeleccionados.push(s.id);
        }
      });
    } else {
      modulo.subModulos.forEach((s: any) => {
        this.subModulosSeleccionados = this.subModulosSeleccionados.filter(x => x !== s.id);
      });
    }
  }

  estaModuloCompleto(modulo: any): boolean {
    if (!modulo.subModulos || modulo.subModulos.length === 0) return false;
    return modulo.subModulos.every((s: any) => this.subModulosSeleccionados.includes(s.id));
  }
  guardarRol() {
    if (!this.nuevoRol.nombre.trim()) {
      Swal.fire('Error', 'El nombre del rol no puede estar vacío.', 'error');
      return;
    }

    const payload = {
      id: this.nuevoRol.id,
      nombre: this.nuevoRol.nombre,
      estado: this.nuevoRol.estado
    };

    if (this.editando) {
      this.rolesService.updateRol(this.nuevoRol.id, payload).subscribe({
        next: () => {
          console.log('Submódulos seleccionados:', this.subModulosSeleccionados);
          this.rolesService.actualizarSubModulos(this.nuevoRol.id, this.subModulosSeleccionados).subscribe({
            next: () => {
              this.cargarRoles();
              this.toggleFormulario();
              Swal.fire('¡Actualizado!', 'Rol y submódulos actualizados correctamente.', 'success');
            },
            error: (err) => {
              console.error(err);
              Swal.fire('Error', 'No se pudieron actualizar los submódulos.', 'error');
            }
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar el rol.', 'error');
        }
      });
    } else {
      this.rolesService.addRol(payload).subscribe({
        next: (res: any) => {
          const rolId = res.id; 
          console.log('Nuevo rol creado, submódulos:', this.subModulosSeleccionados); // depuración
          this.rolesService.actualizarSubModulos(rolId, this.subModulosSeleccionados).subscribe({
            next: () => {
              this.cargarRoles();
              this.toggleFormulario();
              Swal.fire('¡Agregado!', 'Rol y submódulos agregados correctamente.', 'success');
            },
            error: (err) => {
              console.error(err);
              Swal.fire('Error', 'No se pudieron agregar los submódulos.', 'error');
            }
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Ya existe un rol con ese nombre.', 'error');
        }
      });
    }
  }

  editarRol(rol: any) {
    this.nuevoRol = { id: rol.id, nombre: rol.nombre, estado: rol.estado };
    this.editando = true;
    this.mostrarFormulario = true;
    this.subModulosSeleccionados = [];

    this.modulosService.getSubModulosByRol(rol.id).subscribe({
      next: (data: any[]) => {
        this.subModulosSeleccionados = data.map(s => s.subModuloId);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al obtener submódulos del rol", err)
    });
  }

  eliminarRol(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rolesService.deleteRol(id).subscribe({
          next: () => {
            this.roles = this.roles.filter(r => r.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'El rol ha sido eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el rol.', 'error')
        });
      }
    });
  }
}
