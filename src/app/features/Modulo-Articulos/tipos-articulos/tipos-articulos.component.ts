import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TipoArticuloService } from '../../../core/services/tipo-articulos.service';
import { CamposArticuloService } from '../../../core/services/campos-articulo.service';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../shared/components/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tipo-articulos',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './tipos-articulos.component.html',
  styleUrls: ['./tipos-articulos.component.css']
})
export class TipoArticulosComponent implements OnInit {

  tiposArticulos: any[] = [];
  registrosPaginados: any[] = [];

  nuevoArticulo: any = {
    id: null,
    nombre: "",
    descripcion: "",
    estado: 1,
    imagen: null,
    imagenPreview: null,
    imagenPath: null
  };

  mostrarFormulario = false;
  editando = false;
  mostrarCampos = false;
  editandoCampos = false;

  tipoSeleccionado: any = null;
  camposTemporales: any[] = [];

  filtro = "";
  paginaActual = 1;
  registrosPorPagina = 6;
  totalPaginas = 1;

  constructor(
    private tipoArticuloService: TipoArticuloService,
    private campoArticuloService: CamposArticuloService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarTipos();
  }

  /* ================= TIPOS ARTICULO ================= */

  cargarTipos() {
    this.tipoArticuloService.getTipoArticulos().subscribe({
      next: data => {
        this.tiposArticulos = data;
        this.aplicarFiltro();
      },
      error: () => Swal.fire("Error", "No se pudieron cargar los tipos de artículos", "error")
    });
  }

  aplicarFiltro() {
    let lista = this.tiposArticulos;

    if (this.filtro.trim()) {
      lista = lista.filter(x =>
        x.nombre.toLowerCase().includes(this.filtro.toLowerCase())
      );
    }

    this.totalPaginas = Math.ceil(lista.length / this.registrosPorPagina);
    this.paginaActual = 1;
    this.actualizarPagina(lista);
  }

  actualizarPagina(lista: any[]) {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    this.registrosPaginados = lista.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(num: number) {
    if (num < 1 || num > this.totalPaginas) return;
    this.paginaActual = num;
    this.aplicarFiltro();
  }

  /* ───────── FORMULARIO ───────── */
  toggleFormulario() {
    this.mostrarCampos = false;
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) {
      this.resetArticulo();
    }
  }

  resetArticulo() {
    this.editando = false;
    this.nuevoArticulo = {
      id: null,
      nombre: "",
      descripcion: "",
      estado: 1,
      imagen: null,
      imagenPreview: null,
      imagenPath: null
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.nuevoArticulo.imagen = file;
    const reader = new FileReader();
    reader.onload = () => this.nuevoArticulo.imagenPreview = reader.result;
    reader.readAsDataURL(file);
  }

  quitarImagen() {
    this.nuevoArticulo.imagen = null;
    this.nuevoArticulo.imagenPreview = null;
    this.nuevoArticulo.imagenPath = null;
  }

guardarArticulo() {
  if (!this.nuevoArticulo.nombre.trim()) {
    Swal.fire("Advertencia", "El nombre es obligatorio", "warning");
    return;
  }

  const formData = new FormData();
  formData.append("nombre", this.nuevoArticulo.nombre);
  formData.append("descripcion", this.nuevoArticulo.descripcion);
  formData.append("estado", String(this.nuevoArticulo.estado));

  if (this.nuevoArticulo.imagen) {
    formData.append("imagen", this.nuevoArticulo.imagen);
  } else if (this.editando && this.nuevoArticulo.imagenPath) {
    formData.append("imagenPath", this.nuevoArticulo.imagenPath);
  }

  const request = this.editando
    ? this.tipoArticuloService.updateTipoArticulo(this.nuevoArticulo.id, formData)
    : this.tipoArticuloService.addTipoArticulo(formData);

  request.subscribe({
    next: () => {
      Swal.fire("Éxito", "Guardado correctamente", "success");
      this.toggleFormulario();
      this.cargarTipos();
    },
    error: e => {
      Swal.fire(
        "No permitido",
        e?.error?.message || "Error al guardar",
        "warning"
      );
    }
  });
}


  editarTipoArticulo(data: any) {
    this.editando = true;
    this.mostrarFormulario = true;

    this.nuevoArticulo = {
      id: data.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      estado: data.estado,
      imagen: null,
      imagenPreview: data.imagenPath ? `http://localhost:7000/${data.imagenPath}` : null,
      imagenPath: data.imagenPath
    };
  }

  eliminarTipoArticulo(id: number) {
    Swal.fire({
      title: '¿Eliminar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar'
    }).then(res => {
      if (res.isConfirmed) {
        this.tipoArticuloService.deleteTipoArticulo(id).subscribe({
          next: (r: any) => {
            Swal.fire("Eliminado", r.message, "success");
            this.cargarTipos();
          },
          error: e =>
            Swal.fire("No permitido", e?.error?.message || "Error", "error")
        });
      }
    });
  }

  verArticulosTipoArticulo(tipo: any) {
    this.router.navigate(['/tipos-articulos', tipo.id]);
  }

  /* ================= CAMPOS ================= */

  abrirCampos(tipo: any) {
    this.mostrarFormulario = false;
    this.editandoCampos = true;
    this.tipoSeleccionado = tipo;
    this.mostrarCampos = true;

    this.campoArticuloService.getCamposByTipoArticulo(tipo.id).subscribe({
      next: data => {
        this.camposTemporales = data.map((c: any) => ({
          id: c.id,
          nombre: c.nombreCampo,
          tipo: c.tipoDato
        }));
      },
      error: () => this.camposTemporales = []
    });
  }

  agregarCampo() {
    this.camposTemporales.push({ id: null, nombre: "", tipo: "texto" });
  }

  eliminarCampo(i: number) {
    this.camposTemporales.splice(i, 1);
  }

  async guardarCampos() {
    for (const c of this.camposTemporales) {
      if (!c.nombre.trim()) {
        Swal.fire("Advertencia", "Todos los campos deben tener nombre", "warning");
        return;
      }
    }

    const peticiones = this.camposTemporales.map(campo => {
      const dto = {
        nombreCampo: campo.nombre,
        tipoDato: campo.tipo,
        tipoArticuloId: this.tipoSeleccionado.id // ✅ CLAVE
      };

      return campo.id
        ? this.campoArticuloService.updateCampo(campo.id, dto).toPromise()
        : this.campoArticuloService.addCampo(dto).toPromise();
    });

    try {
      await Promise.all(peticiones);
      this.cerrarCampos();
      Swal.fire("Guardado", "Campos guardados correctamente", "success");
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudieron guardar los campos", "error");
    }
  }

  cerrarCampos() {
    this.mostrarCampos = false;
    this.editandoCampos = false;
    this.camposTemporales = [];
    this.tipoSeleccionado = null;
  }
}
