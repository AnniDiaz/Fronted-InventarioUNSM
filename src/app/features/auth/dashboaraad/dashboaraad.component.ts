import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboaraad',
  imports: [SidebarComponent, HeaderComponent, FormsModule, CommonModule],
  templateUrl: './dashboaraad.component.html',
  styleUrl: './dashboaraad.component.css'
})
export class DashboardComponent implements OnInit {
   topUbicaciones: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  barChart: any;  
  pieChart: any;

  ngOnInit(): void {
    this.cargarTotalesTipos();
    this.cargarGraficos();
    this.cargarTopUbicaciones();
  }

  // 📌 1) Cargar tarjetas (computadoras, laptops, mouses)
  cargarTotalesTipos() {
    this.dashboardService.getArticulosPorTipo().subscribe((data: any[]) => {
      // data = [{ tipo: "Laptops", cantidad: 3 }, ... ]

      const comp = data.find(d => d.tipo === "Computadoras")?.cantidad || 0;
      const lap = data.find(d => d.tipo === "Laptops")?.cantidad || 0;
      const mou = data.find(d => d.tipo === "Mouses")?.cantidad || 0;

      (document.getElementById('totalComputadoras') as HTMLElement).textContent = comp.toString();
      (document.getElementById('totalLaptops') as HTMLElement).textContent = lap.toString();
      (document.getElementById('totalMouses') as HTMLElement).textContent = mou.toString();
    });
  }

  // 📌 2) Gráficos (barras y circular)
  cargarGraficos() {
    this.dashboardService.getArticulosPorUbicacion().subscribe((data: any[]) => {
      // data = [{ ubicacion: "Aulas", cantidad: 50 }, ...]

      const labels = data.map(d => d.ubicacion);
      const valores = data.map(d => d.cantidad);

      // ---- GRÁFICO DE BARRAS ----
      this.barChart = new Chart('barChart', {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Artículos',
            data: valores
          }]
        }
      });

      // ---- GRÁFICO CIRCULAR ----
      this.pieChart = new Chart('pieChart', {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: valores
          }]
        }
      });
    });
  }

  // 📌 3) Top 3 ubicaciones
  cargarTopUbicaciones() {
  this.dashboardService.getArticulosPorUbicacion().subscribe((data: any[]) => {
    this.topUbicaciones = data
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  });
}

}
