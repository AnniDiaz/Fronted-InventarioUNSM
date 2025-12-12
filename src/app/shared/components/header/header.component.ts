import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoginService } from '../../../core/services/login.service';
import { Router } from '@angular/router';

// Define una interfaz para tu usuario
interface Usuario {
  id: number;
  username: string;
  email?: string;
  imagenPath?: string;
  rol?: {
    id: number;
    nombreRol: string;
  };
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  usuarioActual: Usuario | null = null;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef // <--- Importante
  ) {}

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  ngOnInit(): void {
    // Cargar usuario inicial desde localStorage
    this.usuarioActual = this.loginService.getUser();

    // Suscribirse a cambios de usuario
    this.loginService.usuario$.subscribe((usuario: Usuario | null) => {
      this.usuarioActual = usuario;

      // Forzar actualización de la vista
      this.cdr.detectChanges();
    });
  }

}
