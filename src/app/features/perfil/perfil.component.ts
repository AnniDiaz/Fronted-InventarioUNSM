import { Component, OnInit } from '@angular/core';
import { LoginService } from '../../core/services/login.service'; // <-- Importa LoginService
import { UsuariosService } from '../../core/services/usuarios.service';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css'],
})
export class PerfilComponent implements OnInit {

  usuario: any = null;

  password = {
    actual: '',
    nueva: '',
    confirmar: ''
  };

  imagenSeleccionada: File | null = null;

  constructor(private usuariosService: UsuariosService,
    private loginService: LoginService
  ) {}

  ngOnInit(): void {
    this.cargarUsuario();
  }

  cargarUsuario() {
    this.usuariosService.getUsuarioActual().subscribe({
      next: (data: any) => {
        this.usuario = data;
        // Previsualización de la imagen
        this.usuario.imagenPreview = data.imagenPath 
          ? `http://localhost:7000/${data.imagenPath}` 
          : '/assets/perfil.png';
      },
      error: () => Swal.fire("Error", "No se pudo cargar el usuario", "error"),
    });
  }

  // ------------------- CAMBIO DE FOTO -------------------
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.imagenSeleccionada = file;

    const reader = new FileReader();
    reader.onload = () => this.usuario.imagenPreview = reader.result;
    reader.readAsDataURL(file);
  }

  quitarImagen() {
    this.imagenSeleccionada = null;
    this.usuario.imagenPreview = this.usuario.imagenPath 
      ? `http://localhost:7000/${this.usuario.imagenPath}` 
      : '/assets/perfil.png';
  }

 // ------------------- CAMBIO DE FOTO -------------------
guardarImagen() {
  if (!this.imagenSeleccionada) return;

  this.usuariosService.actualizarImagen(this.imagenSeleccionada).subscribe({
    next: (res: any) => {
      Swal.fire("¡Éxito!", "Imagen actualizada correctamente", "success");

      // Actualizar la previsualización en PerfilComponent
      this.usuario.imagenPreview = `http://localhost:7000/${res.imagenPath}`;

      // Actualizar el usuario en LoginService para que el Header se refresque
      const usuarioActualizado = { ...this.usuario, imagenPath: res.imagenPath };
      this.loginService.actualizarUsuario(usuarioActualizado);

      // Limpiar selección
      this.imagenSeleccionada = null;
    },
    error: (err) => {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar la imagen", "error");
    }
  });
}



  // ------------------- CAMBIO DE CONTRASEÑA -------------------
  cambiarPassword() {
    if (this.password.nueva !== this.password.confirmar) {
      Swal.fire("Error", "Las contraseñas no coinciden", "error");
      return;
    }

    const payload = {
      passwordActual: this.password.actual,
      passwordNueva: this.password.nueva
    };

    this.usuariosService.cambiarPassword(payload).subscribe({
      next: () => {
        Swal.fire("Éxito", "Contraseña actualizada correctamente", "success");
        this.password = { actual: '', nueva: '', confirmar: '' };
      },
      error: () => {
        Swal.fire("Error", "La contraseña actual es incorrecta", "error");
      }
    });
  }

}
