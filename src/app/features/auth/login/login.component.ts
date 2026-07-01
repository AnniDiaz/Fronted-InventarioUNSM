import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';

import { LoginService } from '../../../core/services/login.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginData = {
    username: '',
    password: ''
  };

  hide: boolean = true;
  mensajeError: string = '';

  constructor(
    private snack: MatSnackBar,
    private loginService: LoginService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  formSubmit() {

    if (!this.loginData.username.trim() || !this.loginData.password.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'El usuario y contraseña son obligatorios',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // 🔐 Paso 1: generar token
    this.loginService.generarToken(this.loginData).subscribe(
      (response: any) => {

        const token = response.token;
        this.loginService.loginUser(token);

        // 👤 Paso 2: obtener usuario
        this.loginService.getCurrentUser().subscribe(
          (user: any) => {

            this.loginService.setUser(user);

            const rolId = Number(user.data.rolId);
            localStorage.setItem('rolId', rolId.toString());

            // 🚀 REDIRECCIÓN POR ROL
            switch (rolId) {

              case 1:
                this.router.navigate(['/gestion-institucional']);
                break;

              default:
                this.router.navigate(['/dashboard']);
                break;
            }

          },
          () => {
            Swal.fire({
              icon: 'error',
              title: 'Error al obtener usuario',
              text: 'No se pudo obtener la información del usuario.',
              confirmButtonText: 'Aceptar'
            });
          }
        );

      },
      () => {
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
