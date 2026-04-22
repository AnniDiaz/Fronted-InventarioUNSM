import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // 👈 Importa withInterceptors
import { authInterceptor } from './core/interceptors/auth-interceptor'; // 👈 Asegúrate de poner la ruta correcta

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])) // 👈 Registra el interceptor aquí
  ]
};