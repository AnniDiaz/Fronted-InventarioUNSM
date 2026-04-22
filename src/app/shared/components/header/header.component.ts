import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoginService } from '../../../core/services/login.service';
import { Router } from '@angular/router';
import { RolesService } from '../../../core/services/roles.service';

// Define una interfaz para tu usuario
interface Usuario {
  id: number;
  username: string;
  nombre?: string;
  email?: string;
  imagenPath?: string;
  rolId?: any;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  usuarioActual: any
  rolActual: any;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef, // <--- Importante
    private rolService: RolesService
  ) { }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

  ngOnInit(): void {
    // Cargar usuario inicial desde localStorage
    this.usuarioActual = this.loginService.getUser();
    console.log("USUARIO ACTUAL: ", this.usuarioActual)

    // Suscribirse a cambios de usuario
    this.loginService.usuario$.subscribe((usuario: Usuario | null) => {
      this.usuarioActual = usuario;

      // Forzar actualización de la vista
      this.cdr.detectChanges();
    });

    this.rolService.getRolById(this.usuarioActual?.data.rolId).subscribe({
      next: (res: any) => {
        this.rolActual = res;
        console.log("ROL ACTUAL: ", this.rolActual)
      }
    })
  }

}
