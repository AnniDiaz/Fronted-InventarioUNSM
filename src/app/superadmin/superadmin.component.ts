import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../shared/components/header/header.component";
import { SidebarComponent } from "../shared/components/sidebar/sidebar.component";
import { TipoUbicacionService } from '../core/services/tipo-ubicacion.service';
import { UbicacionService } from '../core/services/ubicacion.service';
import Swal from 'sweetalert2';
import { UsuariosService } from '../core/services/usuarios.service';
@Component({
  selector: 'app-superadmin',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './superadmin.component.html',
  styleUrls: ['./superadmin.component.css']
})
export class SuperadminComponent implements OnInit {

  menuAbierto = false;

  tabs: any[] = [];
  usuarios: any[] = [];
  tabActivo: string = '';
  tipoActivoId: number = 0;
imagenFile: File | null = null;
imagenPreview: string | ArrayBuffer | null = null;
  ubicaciones: any[] = [];

  mostrarFormulario = false;
  editando = false;

  nuevaUbicacion: any = {
    id: 0,
    nombre: '',
    descripcion: '',
    tipoUbicacionId: 0
  };

  tiposUbicacion: any[] = [];

  constructor(
    private tipoService: TipoUbicacionService,
    private ubicacionService: UbicacionService,
      private usuariosService: UsuariosService

  ) {}
ngOnInit(): void {
  this.cargarTipos();
  this.cargarUsuarios(); // 🔥 IMPORTANTE
}

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) {
      this.resetFormulario();
    }
  }

  resetFormulario() {
    this.editando = false;

    this.nuevaUbicacion = {
      id: 0,
      nombre: '',
      descripcion: '',
      tipoUbicacionId: this.tipoActivoId
    };
  }
cargarUsuarios() {
  this.usuariosService.getUsuarios().subscribe({
    next: (resp: any) => {

      if (resp?.success && Array.isArray(resp.data)) {
        this.usuarios = resp.data;
      } else {
        this.usuarios = [];
      }

    },
    error: () => {
      this.usuarios = [];
    }
  });
}
  cargarTipos() {
    this.tipoService.getTipoUbicaciones().subscribe((resp: any) => {
      const data = Array.isArray(resp.data) ? resp.data : [];

  this.tabs = data.filter((u: any) => {
  const nombre = (u.nombre || '').trim().toLowerCase();
  return nombre === 'oficina' || nombre === 'facultades';
});
      this.tiposUbicacion = data;

      if (this.tabs.length > 0) {
        this.cambiarTab(this.tabs[0]);
      }
    });
  }

cambiarTab(tab: any) {
  this.tabActivo = tab.nombre.toLowerCase();
  this.tipoActivoId = tab.id;

  this.cargarUbicacionesPorTipo(tab.id);
}

cargarUbicacionesPorTipo(tipoId: number) {
  this.ubicacionService.getUbicacionesPorTipo(tipoId).subscribe({
    next: (resp: any) => {

      if (!resp.success) {
        this.ubicaciones = [];
        this.mensajeInfo = resp.message;

        Swal.fire('Información', resp.message, 'info');
        return;
      }

      this.ubicaciones = Array.isArray(resp.data) ? resp.data : [];
      this.mensajeInfo = '';
    },
error: (err) => {

  if (err.status === 404) {
    this.ubicaciones = [];
    this.mensajeInfo = 'No hay ubicaciones para este tipo';
    return;
  }

  this.ubicaciones = [];
  this.mensajeInfo = 'Error al cargar ubicaciones';

  Swal.fire('Error', 'No se pudieron cargar las ubicaciones', 'error');
}
  });
}
abrirModalUbicacion() {
  this.resetFormulario();
  this.resetImagen();

  this.nuevaUbicacion.tipoUbicacionId = this.tipoActivoId; // 🔥 CLAVE
  this.mostrarFormulario = true;
}
guardarUbicacion() {

  if (!this.nuevaUbicacion.nombre) {
    Swal.fire('Error', 'El nombre es obligatorio', 'warning');
    return;
  }

  const formData = new FormData();

  formData.append('nombre', this.nuevaUbicacion.nombre);
  formData.append('descripcion', this.nuevaUbicacion.descripcion || '');
formData.append(
  'tipoUbicacionId',
  this.nuevaUbicacion.tipoUbicacionId.toString()
);
  if (this.imagenFile) {
    formData.append('imagen', this.imagenFile);
  }

  const request = !this.editando
    ? this.ubicacionService.addUbicacionForm(formData)
    : this.ubicacionService.updateUbicacionForm(this.nuevaUbicacion.id, formData);

  request.subscribe({
    next: (resp: any) => {

      // 🔥 AQUÍ manejas error lógico del backend
      if (resp && resp.success === false) {
        Swal.fire('Error', resp.message, 'error');
        return;
      }

      Swal.fire(
        'Éxito',
        this.editando ? 'Ubicación actualizada' : 'Ubicación creada correctamente',
        'success'
      );

      this.toggleFormulario();
      this.cargarUbicacionesPorTipo(this.tipoActivoId);
      this.resetImagen();
    },

    error: (err) => {
      console.error(err);
      Swal.fire('Error', 'Error en el servidor', 'error');
    }
  });
}
mensajeInfo: string = '';
  selectedFile: File | null = null;
onFileSelected(event: any) {
  const file = event.target.files[0];

  if (file) {
    this.imagenFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview = reader.result;
    };

    reader.readAsDataURL(file);
  }
}
mostrarModalUsuario = false;
ubicacionSeleccionada: any = null;
usuarioSeleccionadoId: number = 0;
resetImagen() {
  this.imagenPreview = null;
  this.imagenFile = null;
}

editarUbicacion(u: any) {
  this.editando = true;
  this.mostrarFormulario = true;

  this.nuevaUbicacion = {
    id: u.id,
    nombre: u.nombre,
    descripcion: u.descripcion,
    tipoUbicacionId: u.tipoUbicacionId ?? this.tipoActivoId
  };

  if (u.imagenUrl) {
    this.imagenPreview = 'http://localhost:7000' + u.imagenUrl;
  } else {
    this.imagenPreview = null;
  }

  this.imagenFile = null;
}
asignarResponsable(u: any) {
  this.ubicacionSeleccionada = u;

  // 🔥 AQUÍ es la clave
  this.usuarioSeleccionadoId = u.usuarioId ?? 0;

  this.mostrarModalUsuario = true;
}
cerrarModalUsuario() {
  this.mostrarModalUsuario = false;
  this.ubicacionSeleccionada = null;
  this.usuarioSeleccionadoId = 0;
}
asignarUsuario() {

  if (!this.usuarioSeleccionadoId) {
    Swal.fire('Error', 'Seleccione un usuario', 'warning');
    return;
  }

  const ubicacionId = this.ubicacionSeleccionada.id;

  this.ubicacionService
    .asignarUsuario(ubicacionId, this.usuarioSeleccionadoId)
    .subscribe({
      next: (resp: any) => {

        if (resp?.success === false) {
          Swal.fire('Error', resp.message, 'error');
          return;
        }

        Swal.fire('Éxito', 'Usuario asignado correctamente', 'success');

        this.cerrarModalUsuario();

        // 🔥 refrescar lista
        this.cargarUbicacionesPorTipo(this.tipoActivoId);
      },

      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo asignar usuario', 'error');
      }
    });
}
  eliminarUbicacion(u: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará "${u.nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, eliminar'
    }).then(r => {
      if (r.isConfirmed) {
        this.ubicacionService.deleteUbicacion(u.id).subscribe(() => {
          Swal.fire('Eliminado', 'Ubicación eliminada', 'success');
          this.cargarUbicacionesPorTipo(this.tipoActivoId);
        });
      }
    });
  }

}
