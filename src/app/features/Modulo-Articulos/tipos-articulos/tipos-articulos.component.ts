import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { TipoArticuloService } from '../../../core/services/tipo-articulos.service';
import { CamposArticuloService } from '../../../core/services/campos-articulo.service';
import { HeaderComponent } from "../../../shared/components/header/header.component";
import { SidebarComponent } from "../../../shared/components/sidebar/sidebar.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs'; // ✅ Importante para el manejo moderno de promesas

@Component({
  selector: 'app-tipo-articulos',
  standalone: true,
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './tipos-articulos.component.html',
  styleUrls: ['./tipos-articulos.component.css']
})
export class TipoArticulosComponent implements OnInit {

  tiposArticulos: any[] = [];
  tipoarticulosFiltrados: any[] = [];
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
  menuAbierto = false;
  editando = false;
  mostrarCampos = false;

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
  ) { }

  ngOnInit() {
    this.cargarTipos();
  }

  obtenerPrefijo(nombre: string): string {
    if (!nombre) return '---';
    return nombre.substring(0, 3).toUpperCase();
  }

  /* ================= LÓGICA DE DATOS Y FILTRADO ================= */

  cargarTipos() {
this.tipoArticuloService.getTipoArticulos().subscribe({
  next: (res: any) => {
    this.tiposArticulos = res?.data || [];
    this.ejecutarLogicaFiltrado();
  },
  error: () => Swal.fire("Error", "No se pudieron cargar los tipos", "error")
});
  }

  aplicarFiltro() {
    this.paginaActual = 1;
    this.ejecutarLogicaFiltrado();
  }

  private ejecutarLogicaFiltrado() {
    let lista = [...this.tiposArticulos];

    if (this.filtro && this.filtro.trim()) {
      const termo = this.filtro.toLowerCase().trim();
      lista = lista.filter(x => x.nombre.toLowerCase().includes(termo));
    }

    this.tipoarticulosFiltrados = lista;
    this.totalPaginas = Math.ceil(this.tipoarticulosFiltrados.length / this.registrosPorPagina) || 1;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.registrosPaginados = this.tipoarticulosFiltrados.slice(inicio, fin);
  }

  cambiarPagina(num: number) {
    if (num < 1 || num > this.totalPaginas) return;
    this.paginaActual = num;
    this.actualizarPagina();
  }

  /* ================= GESTIÓN DE FORMULARIO ================= */

toggleFormulario() {
  this.mostrarFormulario = !this.mostrarFormulario;
  if (!this.mostrarFormulario) this.resetArticulo();
}
abrirFormulario() {
  this.mostrarFormulario = true;
}
trackByCampo(index: number, item: any) {
  return item.id ?? index;
}
cerrarFormulario() {
  this.mostrarFormulario = false;
  this.resetArticulo();
}
  resetArticulo() {
    this.editando = false;
    this.nuevoArticulo = {
      id: null, nombre: "", descripcion: "", estado: 1,
      imagen: null, imagenPreview: null, imagenPath: null
    };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.nuevoArticulo.imagen = file;
    const reader = new FileReader();
    reader.onload = () => { this.nuevoArticulo.imagenPreview = reader.result; };
    reader.readAsDataURL(file);
  }

  quitarImagen() {
    this.nuevoArticulo.imagen = null;
    this.nuevoArticulo.imagenPreview = null;
    this.nuevoArticulo.imagenPath = null;
  }

  guardarArticulo() {
    if (!this.nuevoArticulo.nombre?.trim()) {
      Swal.fire("Advertencia", "El nombre es obligatorio", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("nombre", this.nuevoArticulo.nombre);
    formData.append("descripcion", this.nuevoArticulo.descripcion || "");
    formData.append("estado", String(this.nuevoArticulo.estado));

    if (this.nuevoArticulo.imagen) {
      formData.append("imagen", this.nuevoArticulo.imagen);
    }

    const request = this.editando
      ? this.tipoArticuloService.updateTipoArticulo(this.nuevoArticulo.id, formData)
      : this.tipoArticuloService.addTipoArticulo(formData);

    request.subscribe({
      next: () => {
Swal.fire("Éxito", "Guardado correctamente", "success").then(() => {
  this.mostrarFormulario = false;   // 👈 cerrar modal directo
  this.resetArticulo();             // 👈 limpiar formulario
  this.cargarTipos();              // 👈 recargar lista
});
      },
      error: e => Swal.fire("Error", e?.error?.message || "Error al guardar", "error")
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
      imagenPreview: data.imagenPath ? `http://localhost:7000${data.imagenPath}` : null,
      imagenPath: data.imagenPath
    };
  }

  eliminarTipoArticulo(id: number) {
    Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Se eliminarán los registros asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00a468',
      confirmButtonText: 'Sí, eliminar'
    }).then(res => {
      if (res.isConfirmed) {
        this.tipoArticuloService.deleteTipoArticulo(id).subscribe({
          next: () => {
            Swal.fire("Eliminado", "La categoría ha sido borrada", "success");
            this.cargarTipos();
          },
          error: e => Swal.fire("Error", e?.error?.message || "No se pudo eliminar", "error")
        });
      }
    });
  }

  /* ================= GESTIÓN DE CAMPOS DINÁMICOS ================= */

  abrirCampos(tipo: any) {
    this.tipoSeleccionado = tipo;
    this.mostrarCampos = true;
    this.campoArticuloService.getCamposByTipoArticulo(tipo.id).subscribe({
next: (res: any) => {
  console.log("CAMPOS BACKEND:", res);

  const data = res?.data || [];

  this.camposTemporales = data.map((c: any) => ({
    id: c.id,
    nombre: c.nombreCampo,
    tipo: c.tipoDato || 'texto'
  }));

  console.log("CAMPOS FRONT:", this.camposTemporales);
}
    });
  }

  agregarCampo() {
    this.camposTemporales.push({ id: null, nombre: "", tipo: "texto" });
  }

  eliminarCampo(i: number) {
    this.camposTemporales.splice(i, 1);
  }

async guardarCampos() {
  // Validación básica
  if (this.camposTemporales.some(c => !c.nombre.trim())) {
    Swal.fire("Advertencia", "Todos los campos deben tener un nombre", "warning");
    return;
  }

  try {
    // Promesas de guardado / actualización
    const promesas = this.camposTemporales.map(campo => {
      const dto = {
        nombreCampo: campo.nombre,
        tipoDato: campo.tipo,
        tipoArticuloId: this.tipoSeleccionado.id
      };

      return campo.id
        ? lastValueFrom(this.campoArticuloService.updateCampo(campo.id, dto))
        : lastValueFrom(this.campoArticuloService.addCampo(dto));
    });

    await Promise.all(promesas);

    Swal.fire("Éxito", "Configuración de campos guardada", "success");
    this.cerrarCampos();

  } catch (e: any) {
    console.log("ERROR COMPLETO:", e);

    const msg =
      e?.error?.message ||
      e?.message ||
      'Ocurrió un problema al guardar los campos';

    Swal.fire("Error", msg, "error");
  }
}

  cerrarCampos() {
    this.mostrarCampos = false;
    this.camposTemporales = [];
    this.tipoSeleccionado = null;
  }

  toggleMenu() { this.menuAbierto = !this.menuAbierto; }
  verArticulosTipoArticulo(tipo: any) { this.router.navigate(['/tipos-articulos', tipo.id]); }
}
