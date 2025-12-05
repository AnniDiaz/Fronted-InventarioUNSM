import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ModulosService, Modulo } from '../../../../app/core/services/modulos.service';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '../../../core/services/login.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  modulos: Modulo[] = [];
  expanded: Record<number, boolean> = {};
  usuarioActual: any = null;

  constructor(
    private modulosService: ModulosService,
    private loginService: LoginService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarModulos();
    this.usuarioActual = this.loginService.getUser();
  }

  cargarModulos() {
    this.modulosService.getModulos().subscribe({
      next: (data) => this.modulos = data,
      error: (err) => console.error('Error cargando módulos:', err)
    });
  }

  toggle(id: number) {
    this.expanded[id] = !this.expanded[id];
  }

  logout() {
    this.loginService.logout();
    this.router.navigate(['/login']);
  }
}
