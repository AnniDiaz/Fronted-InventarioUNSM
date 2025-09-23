import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TipoArticulosService } from '../../core/services/tipo-articulos.service';

@Component({
  selector: 'app-tipos-articulos',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './tipos-articulos.component.html',
  styleUrl: './tipos-articulos.component.css'
})
export class TiposArticulosComponent {
  filtro: string = '';
  articulos: any[] = [];
  mostrarFormulario = false;
  archivoSeleccionado: File | null = null;
  nuevoArticulo = {
    nombre: '',
    descripcion: '',
    estado: 1,
    imagenPreview: '' as string | undefined // <-- ahora opcional
  };

  constructor(private articulosService: TipoArticulosService, private router: Router) {}

  verArticulosPorTipo(idTipo: number) {
    this.router.navigate(['/articulos/tipo', idTipo]);
  }

  cargarArticulos() {
    this.articulosService.getTipoArticulo().subscribe({
      next: (data: any) => {
        this.articulos = data;
      },
      error: (err) => {
        console.error("Error al obtener artículos", err);
      }
    });
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
  }

  ngOnInit(): void {
    this.cargarArticulos();
  }

  onFileSelected(event: any) {
    this.archivoSeleccionado = event.target.files[0];

    if (this.archivoSeleccionado) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.nuevoArticulo.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(this.archivoSeleccionado);
    }
  }

  quitarImagen() {
    this.nuevoArticulo.imagenPreview = undefined;
    this.archivoSeleccionado = null;
  }

  guardarArticulo() {
    const formData = new FormData();
    formData.append("nombre", this.nuevoArticulo.nombre);
    formData.append("descripcion", this.nuevoArticulo.descripcion);
    formData.append("estado", this.nuevoArticulo.estado.toString());

    if (this.archivoSeleccionado) {
      formData.append("imagen", this.archivoSeleccionado);
    }

    this.articulosService.addTipoArticulo(formData).subscribe({
      next: (res: any) => {
        this.articulos.push(res);
        this.nuevoArticulo = { nombre: '', descripcion: '', estado: 1, imagenPreview: undefined};
        this.archivoSeleccionado = null;
        this.mostrarFormulario = false;
      },
      error: (err) => {
        console.error("Error al guardar", err);
      }
    });
  }
}
