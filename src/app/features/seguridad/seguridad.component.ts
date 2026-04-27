import { Component } from '@angular/core';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-seguridad',
    imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule,RouterModule ],

  templateUrl: './seguridad.component.html',
  styleUrl: './seguridad.component.css'
})
export class SeguridadComponent {
  menuAbierto: boolean = false;
   toggleMenu() { this.menuAbierto = !this.menuAbierto; }

}
