import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../../shared/components/header/header.component";
import { SidebarComponent } from "../../shared/components/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TipoArticulosService } from '../../core/services/tipo-articulos.service';
import { UbicacionService } from '../../core/services/ubicacion.service'; // 👈 importar
import { ActivatedRoute } from '@angular/router';
import { ArticulosService } from '../../core/services/articulos.service';

@Component({
  selector: 'app-articulos',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './articulos.component.html',
  styleUrl: './articulos.component.css'
})
export class ArticulosComponent implements OnInit {
   articulos: any[] = [];
  tipoArticulo: any;
  mostrarFormulario = false;
  ubicaciones: any[] = [];
  tipoArticuloId!: number; // 👈 guardamos el id del enlace

  constructor(
    private route: ActivatedRoute,
    private tipoArticuloService: TipoArticulosService,
    private ubicacionService: UbicacionService,
    private articuloService:ArticulosService
  ) {}

  ngOnInit(): void {
    this.tipoArticuloId = Number(this.route.snapshot.paramMap.get('id')); // 👈 guardamos el id
    this.cargarArticulos(this.tipoArticuloId);
    this.cargarUbicaciones();
  }

  cargarArticulos(idTipo: number) {
    this.tipoArticuloService.getArticulosByTipo(idTipo).subscribe({
      next: (data: any) => {
        this.tipoArticulo = data;
        this.articulos = data.articulos;
      },
      error: (err) => console.error(err),
    });
  }

  cargarUbicaciones() {
    this.ubicacionService.getUbicaciones().subscribe({
      next: (data: any) => {
        this.ubicaciones = data;
      },
      error: (err) => console.error(err),
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  cancelarFormulario() {
    this.mostrarFormulario = false;
  }

  // 👇 Enviar formulario
  guardarArticulo(form: any) {
    if (form.invalid) return;

    const articulo = {
      nombre: form.value.nombre,
      tipoArticuloId: this.tipoArticuloId, // 👈 viene del enlace
      ubicacionId: form.value.ubicacion,   // 👈 lo que se seleccionó en el select
      estado: 1                            // 👈 campo oculto, siempre activo
    };

    console.log("Payload:", articulo);

    // Aquí llamas al servicio para guardar
    this.articuloService.addArticulo(articulo).subscribe({
      next: (res) => {
        console.log("Artículo guardado:", res);
        this.cancelarFormulario(); // cerrar modal
        this.cargarArticulos(this.tipoArticuloId); // recargar lista
      },
      error: (err) => console.error(err)
    });
  }
}
