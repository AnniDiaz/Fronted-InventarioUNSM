import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  menuAbierto = false;
  private sub!: Subscription;

  constructor(private sidebarState: SidebarStateService) {}

  ngOnInit() {
    this.sub = this.sidebarState.abierto$.subscribe(v => this.menuAbierto = v);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  cerrarMenu() {
    this.sidebarState.close();
  }
}
