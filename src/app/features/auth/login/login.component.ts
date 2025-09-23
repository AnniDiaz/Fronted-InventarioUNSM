import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import Swal from 'sweetalert2';

import { LoginService } from '../../../core/services/login.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, HttpClientModule], // 👈 agrega aquí
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginData = {
    username: '',
    password: ''
  };

  hide: any = true;
  mensajeError: string = '';

  constructor(
    private snack: MatSnackBar,
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {}
formSubmit() {
  if (!this.loginData.username.trim() || !this.loginData.password.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos requeridos',
      text: 'Usuario y contraseña son obligatorios',
      confirmButtonText: 'Aceptar'
    });
    return;
  }

  // Paso 1: Generar token
  this.loginService.generarToken(this.loginData).subscribe(
    (response: any) => {
      const token = response.token; // depende de tu API
      this.loginService.loginUser(token);

      // Paso 2: Obtener usuario actual
      this.loginService.getCurrentUser().subscribe(
        (user: any) => {
          this.loginService.setUser(user);
          console.log("Usuario actual:", user);

          this.router.navigate(['/dashboard']); // ruta ejemplo

          this.snack.open(`Bienvenido ${user.username}`, 'Cerrar', { duration: 3000 });
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al obtener datos del usuario',
            text: 'No se pudo obtener la información del usuario.',
            confirmButtonText: 'Aceptar'
          });
        }
      );
    },
    (error) => {
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: 'Usuario o contraseña incorrectos',
        confirmButtonText: 'Aceptar'
      });
    }
  );
}
}
