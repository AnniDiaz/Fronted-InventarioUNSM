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
      rolId: 0,
      imagen: null,
      imagenPreview: null,
      imagenPath: null
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
    next: (resp: any) => {
      console.log("ROLES RESPUESTA:", resp);

      // 🔥 VALIDAR Y EXTRAER BIEN
      if (!resp || !resp.success || !Array.isArray(resp.data)) {
        console.warn("Roles inválidos:", resp);
        this.roles = [];
        return;
      }

      this.roles = resp.data; // 👈 AQUÍ ESTÁ LA CLAVE

      console.log("ROLES ARRAY:", this.roles);

      this.cargarUsuarios(); // después de tener roles
    },
    error: err => {
      console.error("Error al cargar roles", err);
      this.roles = [];
    }
  });
}

cargarUsuarios() {
  this.usuariosService.getUsuarios().subscribe({
    next: (resp: any) => {
      console.log("RESPUESTA COMPLETA:", resp);

      // 🔥 VALIDACIÓN CLAVE
      if (!resp || !resp.success || !Array.isArray(resp.data)) {
        console.warn("La respuesta no es válida:", resp);
        this.usuarios = [];
        this.usuariosFiltrados = [];
        return;
      }

      const usuariosArray = resp.data;

      this.usuarios = usuariosArray.map((u: any) => ({
        id: u.id,
        nombres: u.nombre || '',
        apellidos: u.apellido || '',
        email: u.email || '',
        username: u.username || '',
        rolId: u.rolId,
        imagenPath: u.imagenUrl || null,

        // 🔥 CRUCE CON ROLES
        rolNombre: this.roles.find(r => r.id === u.rolId)?.nombre || 'Sin rol'
      }));

      console.log("USUARIOS PROCESADOS:", this.usuarios);

      this.aplicarFiltro();
    },
    error: err => {
      console.error("Error al obtener usuarios", err);
      this.usuarios = [];
      this.usuariosFiltrados = [];
    }
  });
}
aplicarFiltro() {
  if (!this.usuarios || this.usuarios.length === 0) {
    this.usuariosFiltrados = [];
    return;
  }

  const texto = this.filtro.trim().toLowerCase();

  this.usuariosFiltrados = texto
    ? this.usuarios.filter(u =>
        (u.nombres || '').toLowerCase().includes(texto) ||
        (u.username || '').toLowerCase().includes(texto)
      )
    : [...this.usuarios]; // 👈 importante

  console.log("FILTRADOS:", this.usuariosFiltrados);

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
      if (!this.mostrarFormulario) this.resetUsuario();
    }

    resetUsuario() {
      this.nuevoUsuario = {
        id: 0,
        nombres: '',
        apellidos: '',
        email: '',
        username: '',
        password: '',
        rolId: 0,
        imagen: null,
        imagenPreview: null,
        imagenPath: null
      };
      this.editando = false;
    }

    // Manejo de imagen
    onFileSelected(event: any) {
      const file = event.target.files[0];
      if (!file) return;
      this.nuevoUsuario.imagen = file;

      const reader = new FileReader();
      reader.onload = () => this.nuevoUsuario.imagenPreview = reader.result;
      reader.readAsDataURL(file);
    }

    quitarImagen() {
      this.nuevoUsuario.imagen = null;
      this.nuevoUsuario.imagenPreview = null;
      this.nuevoUsuario.imagenPath = null;
    }

    guardarUsuario() {
    const formData = new FormData();

    // Campos obligatorios según tu DTO
    formData.append("Nombres", this.nuevoUsuario.nombres);
    formData.append("Apellidos", this.nuevoUsuario.apellidos || '');
    formData.append("Email", this.nuevoUsuario.email);
    formData.append("Username", this.nuevoUsuario.username);
    formData.append("RolId", String(this.nuevoUsuario.rolId));

    // Password solo si es nuevo o se cambió
    if (!this.editando || this.nuevoUsuario.password) {
      formData.append("Password", this.nuevoUsuario.password || '');
    }

    // Imagen
    if (this.nuevoUsuario.imagen) {
      formData.append("Imagen", this.nuevoUsuario.imagen);
    } else if (this.editando && this.nuevoUsuario.imagenPath) {
      formData.append("ImagenPath", this.nuevoUsuario.imagenPath);
    }

    if (this.editando) {
      this.usuariosService.updateUsuario(this.nuevoUsuario.id, formData).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.toggleFormulario();
          Swal.fire('¡Actualizado!', 'Usuario actualizado correctamente.', 'success');
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo actualizar el usuario. Revisa Email y demás campos.', 'error');
        }
      });
    } else {
      this.usuariosService.addUsuario(formData).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.toggleFormulario();
          Swal.fire('¡Agregado!', 'Usuario registrado correctamente.', 'success');
        },
      error: (err) => {

  const mensaje =
    err?.error?.message ||
    err?.error?.errors ||
    'No se pudo registrar el usuario';

  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: mensaje
  });
}
      });
    }
  }


    editarUsuario(usuario: any) {
  const urlBase = "http://localhost:4200/"; // sin "usuarios/"

  this.nuevoUsuario = {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    username: usuario.username,
    password: '',
    rolId: usuario.rolId,
    imagen: null,
    imagenPreview: usuario.imagenPath ? urlBase + usuario.imagenPath : null,
    imagenPath: usuario.imagenPath
  };

  this.editando = true;
  this.mostrarFormulario = true;
}

validarPassword(pass: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{5,}$/.test(pass);
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
