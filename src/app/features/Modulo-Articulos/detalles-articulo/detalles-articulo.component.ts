import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticuloService } from '../../../core/services/articulos.service';
import { SidebarComponent } from "../../../shared/components/sidebar/sidebar.component";
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <- necesario para ngModel

@Component({
  selector: 'app-detalles-articulo',
  templateUrl: './detalles-articulo.component.html',
  styleUrls: ['./detalles-articulo.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, HeaderComponent]
})
export class DetallesArticuloComponent implements OnInit {
  articulo: any;
  idArticulo!: number;

  mostrarReporte: boolean = false; // <- controla la visibilidad del formulario

  // Formulario de reporte
  reporte = {
    gradoDificultad: '',
    descripcion: ''
  };

  constructor(
    private route: ActivatedRoute,
    private articuloService: ArticuloService
  ) {}

  ngOnInit(): void {
    this.idArticulo = Number(this.route.snapshot.paramMap.get('id'));
    this.getArticuloDetalles();
  }

  getArticuloDetalles() {
    this.articuloService.getArticuloById(this.idArticulo).subscribe({
      next: (data) => this.articulo = data,
      error: (err) => console.error('Error al traer el artículo', err)
    });
  }

  guardarReporte() {
    console.log('Reporte guardado:', this.reporte);
    alert('Reporte guardado correctamente!');
    // Aquí puedes llamar a un servicio para guardar el reporte
  }
}
