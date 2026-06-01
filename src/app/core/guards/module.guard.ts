import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import Swal from 'sweetalert2';

export const moduleGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);

  const modulos = JSON.parse(localStorage.getItem('modulos') || '[]');

  const url = state.url.split('?')[0].replace(/\/$/, '');

  // 🔥 extraer TODAS las rutas sin duplicados
  const rutasPermitidas = new Set<string>();

  modulos.forEach((mod: any) => {

    if (mod.ruta) {
      rutasPermitidas.add(mod.ruta.replace(/\/$/, ''));
    }

    mod.subModulos?.forEach((sub: any) => {
      if (sub.ruta) {
        rutasPermitidas.add(sub.ruta.replace(/\/$/, ''));
      }
    });

  });

  const tieneAcceso = Array.from(rutasPermitidas).some(r =>
    url === r || url.startsWith(r + '/')
  );

  if (tieneAcceso) return true;

  Swal.fire({
    icon: 'error',
    title: 'Acceso denegado',
    text: 'No tienes permiso para entrar a este módulo'
  });

  router.navigate(['/dashboard']);
  return false;
};
