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

  this.usuarioActual = this.loginService.getUser();
  console.log("USUARIO ACTUAL: ", this.usuarioActual);

  if (!this.usuarioActual?.data) return;

  const rolId = this.usuarioActual.data.rolId;

  // 🔥 CARGAR ROL
  if (rolId) {
    this.rolService.getRolById(rolId).subscribe({
      next: (res: any) => {
        this.rolActual = res.data; // 👈 IMPORTANTE
        console.log("ROL ACTUAL: ", this.rolActual);
      }
    });
  }
}
}
