import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

const centerTextPlugin: any = {
  id: 'centerText',
  beforeDraw: function (chart: any) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    const width = chartArea.right - chartArea.left;
    const height = chartArea.bottom - chartArea.top;
    const centerX = chartArea.left + width / 2;
    const centerY = chartArea.top + height / 2;

    ctx.restore();

    // Configs for text
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.75; // Based on cutout: '75%'

    const fontSizeMain = Math.max(14, Math.round(innerRadius * 0.5));
    const fontSizeSub = Math.max(9, Math.round(innerRadius * 0.2));

    // Draw 100%
    ctx.font = `bold ${fontSizeMain}px Inter, sans-serif`;
    ctx.fillStyle = '#111827';
    ctx.fillText("100%", centerX, centerY - (fontSizeMain * 0.1));

    // Draw TOTAL
    ctx.font = `bold ${fontSizeSub}px Inter, sans-serif`;
    ctx.fillStyle = '#6b7280';
    ctx.fillText("TOTAL", centerX, centerY + (fontSizeMain * 0.5) + 2);

    ctx.save();
  }
};

@Component({
  selector: 'app-dashboaraad',
  imports: [SidebarComponent, HeaderComponent, CommonModule],
  templateUrl: './dashboaraad.component.html',
  styleUrls: ['./dashboaraad.component.css']
})
export class DashboardComponent implements OnInit {

  // Cambiado de isSidebarOpen a menuAbierto para mantener coherencia
  menuAbierto = false;

  totalArticulos = 4;
  totalUbicaciones = 4;
  totalTraslados = 0;
  totalValor = 2210;

  categorias = [
    { nombre: 'Laptops', valor: 25, color: '#10b981' },
    { nombre: 'Monitores', valor: 25, color: '#3b82f6' },
    { nombre: 'Accesorios', valor: 25, color: '#f59e0b' },
    { nombre: 'Multimedia', valor: 25, color: '#ef4444' }
  ];

  articulos = [
    { codigo: 'FISI-004', nombre: 'Proyector Epson', categoria: 'Multimedia', ubicacion: 'Auditorio', estado: 'dañado', fecha: '2025-12-19' },
    { codigo: 'FISI-003', nombre: 'Mouse Logitech G502', categoria: 'Accesorios', ubicacion: 'Lab de Redes', estado: 'nuevo', fecha: '2025-12-18' },
    { codigo: 'FISI-002', nombre: 'Monitor LG 24"', categoria: 'Monitores', ubicacion: 'Aula 1', estado: 'usado', fecha: '2025-12-17' },
    { codigo: 'FISI-001', nombre: 'Laptop Dell Latitude', categoria: 'Laptops', ubicacion: 'Lab de Sistemas', estado: 'nuevo', fecha: '2025-12-16' }
  ];

  ngOnInit() {
    new Chart('barChart', {
      type: 'bar',
      data: {
        labels: ['Lab de Sistemas', 'Aula 1', 'Lab de Redes', 'Auditorio'],
        datasets: [{
          data: [1, 1, 1, 1],
          backgroundColor: '#10b981',
          barPercentage: 0.6,
          categoryPercentage: 0.8,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 1.25,
            ticks: {
              stepSize: 0.25,
              color: '#9ca3af',
              font: { family: 'Inter, sans-serif', size: 11 }
            },
            grid: {
              color: '#f3f4f6',
              drawTicks: false
            },
            border: { display: false }
          },
          x: {
            ticks: {
              color: '#9ca3af',
              font: { family: 'Inter, sans-serif', size: 11 }
            },
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });

    new Chart('pieChart', {
      type: 'doughnut',
      plugins: [centerTextPlugin],
      data: {
        labels: this.categorias.map(c => c.nombre),
        datasets: [{
          data: this.categorias.map(c => c.valor),
          backgroundColor: this.categorias.map(c => c.color),
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        cutout: '75%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  // Cambiado de toggleSidebar a toggleMenu para mantener coherencia
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
}