import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import Swal from 'sweetalert2';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

import { SolicitantesService } from '../../core/services/solicitantes.service';
import { LoginService } from '../../core/services/login.service';
import { UbicacionService } from '../../core/services/ubicacion.service';

@Component({
  selector: 'app-solicitantes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    SidebarComponent
  ],
  templateUrl: './solicitantes.component.html',
  styleUrls: ['./solicitantes.component.css']
})
export class SolicitantesComponent implements OnInit {
modoVer = false;
  menuAbierto = false;
  paginaActual: number = 1;
registrosPorPagina: number = 5;
totalPaginas: number = 1;
  mostrarFormulario = false;
  modoEdicion = false;
cargoPersonalizado = '';
  filtroTexto = '';
solicitante = {
  id: 0,
  codigo: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  cargo: '',
  ciclo: '',
  ubicacionId: 0
};

ubicaciones: any[] = [];
  solicitantes: any[] = [];
  registrosPaginados: any[] = [];



  constructor(
    private solicitantesService: SolicitantesService,
      private loginService: LoginService,
  private ubicacionService: UbicacionService
  ) { }

  ngOnInit(): void {
    this.cargarSolicitantes();
  }
onCargoChange() {

  // Si no es estudiante, limpiar ciclo
  if (this.solicitante.cargo !== 'Estudiante') {
    this.solicitante.ciclo = '';
  }

  // Si no es otro, limpiar cargo personalizado
  if (this.solicitante.cargo !== 'Otro') {
    this.cargoPersonalizado = '';
  }
}
  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

toggleFormulario() {

  this.mostrarFormulario = !this.mostrarFormulario;

  if (this.mostrarFormulario) {
    this.cargarUbicacionUsuario();
  }

  if (!this.mostrarFormulario) {
    this.resetFormulario();
    this.modoVer = false; // 👈 IMPORTANTE
  }
}

  resetFormulario() {

    this.modoEdicion = false;

    this.solicitante = {
      id: 0,
  codigo: '',
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  cargo: '',
  ciclo: '',
  ubicacionId: 0

    };
  }
verSolicitante(item: any) {

  this.modoVer = true;
  this.modoEdicion = false;

  this.solicitante = { ...item };

  this.mostrarFormulario = true;
}
cargarSolicitantes() {

  const usuario = this.loginService.getUser();
  const usuarioId = usuario?.data?.id;

  this.solicitantesService.getSolicitantesPorUsuario(usuarioId).subscribe({
    next: (res: any) => {
      this.solicitantes = res.data || [];
      this.aplicarPaginacion();
    },
    error: (err) => {
      console.error(err);
      Swal.fire('Error', 'No se pudieron cargar los solicitantes', 'error');
    }
  });
}

aplicarPaginacion() {

  const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
  const fin = inicio + this.registrosPorPagina;

  const datosFiltrados = this.filtroTexto
    ? this.solicitantes.filter(s =>
        s.nombres?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        s.apellidos?.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        s.codigo?.toLowerCase().includes(this.filtroTexto.toLowerCase())
      )
    : this.solicitantes;

  this.totalPaginas = Math.ceil(datosFiltrados.length / this.registrosPorPagina);

  this.registrosPaginados = datosFiltrados.slice(inicio, fin);
}


cargarUbicacionUsuario() {

  const usuario = this.loginService.getUser();

  if (!usuario?.data?.id) return;

  const usuarioId = usuario.data.id;

  this.ubicacionService
    .getUbicacionesPorUsuario(usuarioId)
    .subscribe({

      next: (res: any[]) => {

        this.ubicaciones = res;

        if (res.length > 0) {

          // Selecciona automáticamente la ubicación del usuario
          this.solicitante.ubicacionId = res[0].id;
        }
      },

      error: (err) => {
        console.error(err);
      }
    });
}
aplicarFiltro() {
  this.paginaActual = 1;
  this.aplicarPaginacion();
}
paginaAnterior() {
  if (this.paginaActual > 1) {
    this.paginaActual--;
    this.aplicarPaginacion();
  }
}

paginaSiguiente() {
  if (this.paginaActual < this.totalPaginas) {
    this.paginaActual++;
    this.aplicarPaginacion();
  }
}
  editarSolicitante(item: any) {

    this.modoEdicion = true;

    this.solicitante = {
      ...item
    };

    this.mostrarFormulario = true;
  }

  guardarSolicitante() {

    // Si seleccionó Otro
if (this.solicitante.cargo === 'Otro') {

  if (!this.cargoPersonalizado.trim()) {

    Swal.fire(
      'Validación',
      'Ingrese el cargo personalizado',
      'warning'
    );

    return;
  }

  this.solicitante.cargo = this.cargoPersonalizado;
}
if (!this.solicitante.nombres.trim()) {
  Swal.fire('Validación', 'Ingrese los nombres', 'warning');
  return;
}

if (!this.solicitante.apellidos.trim()) {
  Swal.fire('Validación', 'Ingrese los apellidos', 'warning');
  return;
}

if (!/^\d{8}$/.test(this.solicitante.codigo)) {
  Swal.fire('Validación', 'El DNI debe tener 8 dígitos', 'warning');
  return;
}

if (!/^\d{9}$/.test(this.solicitante.telefono)) {
  Swal.fire('Validación', 'El teléfono debe tener 9 dígitos', 'warning');
  return;
}

if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    this.solicitante.correo
  )
) {
  Swal.fire(
    'Validación',
    'Ingrese un correo válido',
    'warning'
  );
  return;
}

if (!this.solicitante.cargo) {
  Swal.fire(
    'Validación',
    'Seleccione un cargo',
    'warning'
  );
  return;
}

if (
  this.solicitante.cargo === 'Estudiante' &&
  !this.solicitante.ciclo
) {
  Swal.fire(
    'Validación',
    'Ingrese el ciclo del estudiante',
    'warning'
  );
  return;
}

if (this.solicitante.ubicacionId === 0) {
  Swal.fire(
    'Validación',
    'Seleccione una ubicación',
    'warning'
  );
  return;
}
    if (
      !this.solicitante.codigo ||
      !this.solicitante.nombres ||
      !this.solicitante.apellidos
    ) {

      Swal.fire(
        'Validación',
        'Complete los campos obligatorios',
        'warning'
      );

      return;
    }

    if (this.modoEdicion) {

      this.solicitantesService.updateSolicitante(
        this.solicitante.id,
        this.solicitante
      ).subscribe({

        next: () => {

          Swal.fire(
            'Actualizado',
            'Solicitante actualizado correctamente',
            'success'
          );

          this.cargarSolicitantes();
          this.toggleFormulario();
        },

        error: (err) => {

          console.error(err);

          Swal.fire(
            'Error',
            'No se pudo actualizar el solicitante',
            'error'
          );
        }
      });

    } else {

      this.solicitantesService.addSolicitante(
        this.solicitante
      ).subscribe({

        next: () => {

          Swal.fire(
            'Registrado',
            'Solicitante registrado correctamente',
            'success'
          );

          this.cargarSolicitantes();
          this.toggleFormulario();
        },

     error: (err) => {

  console.error(err);

  const mensaje =
    err?.error?.message ||
    'No se pudo registrar el solicitante';

  Swal.fire(
    'Error',
    mensaje,
    'error'
  );
}
      });
    }
  }

  eliminarSolicitante(id: number) {

    Swal.fire({
      title: '¿Eliminar solicitante?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {

      if (!result.isConfirmed) return;

      this.solicitantesService.deleteSolicitante(id)
        .subscribe({

          next: () => {

            Swal.fire(
              'Eliminado',
              'Solicitante eliminado correctamente',
              'success'
            );

            this.cargarSolicitantes();
          },

          error: (err) => {

            console.error(err);

            Swal.fire(
              'Error',
              'No se pudo eliminar el solicitante',
              'error'
            );
          }
        });
    });
  }

}
