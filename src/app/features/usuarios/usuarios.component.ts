import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { UsuariosService } from '../../../app/core/services/usuarios.service';
import { RolesService } from '../../../app/core/services/roles.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuarios',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent {

  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  filtro: string = '';
  mostrarFormulario: boolean = false;
  editando: boolean = false;

  roles: any[] = [];
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  nuevoUsuario: any = {
    id: 0,
    nombres: '',
    apellidos: '',
    email: '',
    username: '',
    password: '',
    rolId: 0
  };

  constructor(
    private usuariosService: UsuariosService,
    private rolesService: RolesService
  ) {}

  ngOnInit(): void {
  this.cargarRoles();
}

cargarRoles() {
  this.rolesService.getRoles().subscribe({
    next: (rolesData: any[]) => {
      this.roles = rolesData;
      this.cargarUsuarios();
    },
    error: err => console.error("Error al cargar roles", err)
  });
}
cargarUsuarios() {
  this.usuariosService.getUsuarios().subscribe({
    next: (data: any[]) => {
      this.usuarios = data.map(u => ({
        ...u,
        rolNombre: this.roles.find(r => r.id === u.rolId)?.nombre || 'Sin rol'
      }));
      this.aplicarFiltro();
    },
    error: err => console.error("Error al obtener usuarios", err)
  });
}
  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.usuariosFiltrados = texto
      ? this.usuarios.filter(u =>
          u.nombres.toLowerCase().includes(texto) ||
          u.username.toLowerCase().includes(texto)
        )
      : this.usuarios;
    this.paginaActual = 1;
  }
  get totalPaginas(): number {
    return Math.ceil(this.usuariosFiltrados.length / this.registrosPorPagina);
  }

  get usuariosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.usuariosFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) this.paginaActual = p;
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) {
      this.nuevoUsuario = {
        id: 0,
        nombres: '',
        apellidos: '',
        email: '',
        username: '',
        password: '',
        rolId: 0
      };
      this.editando = false;
    }
  }

  guardarUsuario() {
    if (this.editando) {
      const dto = {
        id: this.nuevoUsuario.id,
        nombre: this.nuevoUsuario.nombres,
        apellido: this.nuevoUsuario.apellidos,
        correo: this.nuevoUsuario.email,
        username: this.nuevoUsuario.username,
        estado: "Activo",
        rolId: this.nuevoUsuario.rolId
      };

      this.usuariosService.updateUsuario(dto.id, dto).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.toggleFormulario();
          Swal.fire('¡Actualizado!', 'Usuario actualizado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el usuario.', 'error')
      });

    } else {

      const createDto = {
        nombres: this.nuevoUsuario.nombres,
        apellidos: this.nuevoUsuario.apellidos,
        email: this.nuevoUsuario.email,
        username: this.nuevoUsuario.username,
        password: this.nuevoUsuario.password,
        rolId: this.nuevoUsuario.rolId
      };

      this.usuariosService.addUsuario(createDto).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Usuario registrado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo registrar el usuario.', 'error')
      });
    }
  }

  editarUsuario(usuario: any) {
    this.nuevoUsuario = {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      email: usuario.correo,
      username: usuario.username,
      password: '',
      rolId: usuario.rolId
    };

    this.editando = true;
    this.mostrarFormulario = true;
  }

  eliminarUsuario(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción no se puede revertir",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    }).then(result => {
      if (result.isConfirmed) {
        this.usuariosService.deleteUsuario(id).subscribe({
          next: () => {
            this.usuarios = this.usuarios.filter(u => u.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'Usuario eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
        });
      }
    });
  }

}
