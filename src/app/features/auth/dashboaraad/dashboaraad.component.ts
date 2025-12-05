import { Component } from '@angular/core';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboaraad',
  imports: [SidebarComponent, HeaderComponent, FormsModule, CommonModule],
  templateUrl: './dashboaraad.component.html',
  styleUrl: './dashboaraad.component.css'
})
export class DashboardComponent {

  ngOnInit(): void {
    // 📌 Valores simulados
    const totalComputadoras = 1;
    const totalLaptops = 3;
    const totalMouses = 1;

    const datosPorUbicacion = {
      aulas: 50,
      laboratorios: 35,
      oficinas: 20
    };

    const totalesTiposUbicacion = {
      aulas: 4,
      laboratorios: 2,
      oficinas: 3
    };

    // Mostrar totales en tarjetas
    (document.getElementById('totalComputadoras') as HTMLElement).textContent = totalComputadoras.toString();
    (document.getElementById('totalLaptops') as HTMLElement).textContent = totalLaptops.toString();
    (document.getElementById('totalMouses') as HTMLElement).textContent = totalMouses.toString();

    // GRÁFICO DE BARRAS
    new Chart('barChart', {
      type: 'bar',
      data: {
        labels: ['Aulas', 'Laboratorios', 'Oficinas'],
        datasets: [{
          label: 'Artículos',
          data: [
            datosPorUbicacion.aulas,
            datosPorUbicacion.laboratorios,
            datosPorUbicacion.oficinas
          ]
        }]
      }
    });

    // GRÁFICO CIRCULAR
    new Chart('pieChart', {
      type: 'pie',
      data: {
        labels: ['Aulas', 'Laboratorios', 'Oficinas'],
        datasets: [{
          data: [
            totalesTiposUbicacion.aulas,
            totalesTiposUbicacion.laboratorios,
            totalesTiposUbicacion.oficinas
          ]
        }]
      }
    });

    // TOP UBICACIONES
    const top = [
      { nombre: 'Aula 1', cantidad: 2 },
      { nombre: 'Laboratorio 2', cantidad: 2 },
      { nombre: 'Oficina 1', cantidad: 1 }
    ];

   const lista = document.getElementById('topUbicaciones')!;
    lista.innerHTML = ''; 

    top.forEach(t => {
      const div = document.createElement('div');
      div.classList.add('top-item');
      
      div.innerHTML = `
        <span>${t.nombre}</span>
        <small>${t.cantidad} artículos</small>
      `;

      lista.appendChild(div);
    });
  }

}