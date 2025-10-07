import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { LoginService } from '../services/login.service';
import Swal from 'sweetalert2';

export const authGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const router = inject(Router);

  if (loginService.isLoggedIn()) {
    // Usuario logueado, permite acceso
    return true;
  } else {
    // Usuario no logueado, muestra alerta y redirige
    Swal.fire({
      icon: 'warning',
      title: 'Acceso denegado',
      text: 'Debe iniciar sesión para acceder a esta página',
      confirmButtonText: 'Aceptar'
    });
    router.navigate(['/login']);
    return false;
  }
};
