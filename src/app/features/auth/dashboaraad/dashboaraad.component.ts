import { Component } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboaraad',
  imports: [SidebarComponent, HeaderComponent, FormsModule, CommonModule],
  templateUrl: './dashboaraad.component.html',
  styleUrl: './dashboaraad.component.css'
})
export class DashboaraadComponent {
tutores: any;

}
