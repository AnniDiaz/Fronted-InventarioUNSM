
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { ArticuloService } from '../../core/services/articulos.service';
import { SolicitantesService } from '../../core/services/solicitantes.service';
import { PrestamosService } from '../../core/services/prestamos.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { EscuelaService } from '../../core/services/escuela.service';
import { SearchableSelectComponent, OpcionSelect } from '../../shared/components/searchable-select/searchable-select.component';
@Component({
  selector: 'app-doc-prestamos',
  standalone: true,
imports: [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MatAutocompleteModule,
  MatInputModule,
  MatFormFieldModule,
  MatOptionModule,
  MatIconModule,
  SidebarComponent,
  HeaderComponent,
  SearchableSelectComponent
],
  templateUrl: './doc-prestamos.component.html',
  styleUrls: ['./doc-prestamos.component.css']
})
export class DocPrestamosComponent implements OnInit {
solicitantes: any[] = [];
solicitantesFiltrados: any[] = [];
solicitanteSeleccionado: any = null;
@ViewChild('documentoPDF', { static: false })
documentoPDF!: ElementRef;

nombreSolicitanteCtrl = '';

// --- Modal nuevo solicitante ---
mostrarModalSolicitante = false;
cargoPersonalizadoNuevo = '';
ciclos = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
nuevoSolicitante = {
  nombres: '', apellidos: '', codigo: '',
  telefono: '', correo: '', cargo: '', ciclo: '', ubicacionId: 0
};
  constructor(
    private articuloService: ArticuloService,
    private solicitanteService: SolicitantesService,
      private prestamoService: PrestamosService,
        private router: Router,
          private ubicService: UbicacionService,
          private escuelaService: EscuelaService



  ) {}

  articulos: any[] = [];
articuloId: number = 0;  equipo = '';

get opcionesArticulos(): OpcionSelect[] {
  return this.articulos.map(a => ({
    value: a.id,
    label: `${a.nombre} - ${a.codigoPatrimonial || 'Sin código'}`
  }));
}

ubicacionUsuarioId: number = 0;
ubicacionUsuarioNombre: string = '';
escuelaNombreUsuario: string = '';
prestamos: any[] = [];
  destinatario = '';
ubicaciones: any[] = [];
  // REPRESENTANTE RESPONSABLE
  aprobado: boolean = false;

  nombre = '';
  dni = '';
  ciclo = '';
telefono = '';
  escuela = '';
  direccion = '';
  correo = '';

  // PROYECTO

  actividad = '';

  // LUGAR DE USO

  lugarUso = '';

  // MOTIVO

  detalle = '';

  // FECHAS
solicitanteId: number = 0;
  fechaInicio = '';
  fechaFin = '';

  // UBICACIÓN DOCUMENTO

  ciudad = '';
  fechaDocumento = '';

  // =========================
  // PARTICIPANTES
  // =========================

  participantes: any[] = [];

  nuevoParticipante = {
    nombre: '',
    telefono: '',
    codigo: '',
    correo: ''
  };
ngOnInit(): void {

  this.escuelaNombreUsuario = localStorage.getItem('escuelaNombre') || '';

  this.cargarPorEscuela();

  this.cargarSolicitantes();

  const hoy = new Date();
  this.fechaDocumento = hoy.toISOString().split('T')[0];

}
mostrarSolicitante = (s: any): string => {
  if (!s) return '';
  return `${this.obtenerNombres(s)} ${this.obtenerApellidos(s)}`.trim();
};
cargarPorEscuela(): void {
  const escuelaId = Number(localStorage.getItem('escuelaId'));

  if (!escuelaId) {
    // superadmin o usuario sin escuela asignada (ej. técnico con ubicación propia)
    this.cargarUbicacionUsuarioInfo(() => {
      this.articuloService.getArticulosConCampos().subscribe({
        next: (res: any) => {
          const data = Array.isArray(res) ? res : res?.data ?? [];

          // Técnico con ubicación fija: solo ve los artículos de esa ubicación.
          this.articulos = this.ubicacionUsuarioId
            ? data.filter((a: any) => Number(a.ubicacionId) === this.ubicacionUsuarioId)
            : data;
        },
        error: () => Swal.fire('Error', 'No se pudieron cargar los artículos', 'error')
      });
    });
    return;
  }

  this.cargarUbicacionUsuarioInfo();

  this.ubicService.getUbicacionesPorEscuela(escuelaId).subscribe({
    next: (res: any) => {
      this.ubicaciones = Array.isArray(res) ? res : res?.data ?? [];
    },
    error: () => {}
  });

  this.articuloService.getArticulosPorEscuela(escuelaId).subscribe({
    next: (res: any) => {
      this.articulos = Array.isArray(res) ? res : res?.data ?? [];
    },
    error: () => Swal.fire('Error', 'No se pudieron cargar los artículos', 'error')
  });
}

cargarUbicaciones(): void {

  const usuario = JSON.parse(
    localStorage.getItem('user') || '{}'
  );

  const usuarioId =
    usuario?.data?.id ||
    usuario?.id ||
    usuario?.usuarioId;

  if (!usuarioId) {
    console.error('No se encontró el ID del usuario');
    return;
  }

  this.ubicService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (resp: any) => {

      const ubicacionesUsuario = Array.isArray(resp)
        ? resp
        : resp?.data ?? [];

      if (ubicacionesUsuario.length === 0) {
        return;
      }

      this.ubicacionUsuarioId = Number(
        ubicacionesUsuario[0].id
      );
      this.ubicacionUsuarioNombre = ubicacionesUsuario[0].nombre ?? '';

      console.log(
        '📍 UBICACION PADRE:',
        this.ubicacionUsuarioId
      );

      this.ubicService
        .getUbicacionesPorPadre(this.ubicacionUsuarioId)
        .subscribe({
          next: (res: any) => {

            this.ubicaciones = Array.isArray(res)
              ? res
              : res?.data ?? [];

            console.log(
              '📍 UBICACIONES HIJAS:',
              this.ubicaciones
            );

            this.listarArticulos();

          },
          error: (err) => {
            console.error(err);
          }
        });

    },
    error: (err) => {
      console.error(err);
    }
  });

}

cargarUbicacionUsuarioInfo(onResuelto?: () => void): void {
  const usuario = JSON.parse(localStorage.getItem('user') || '{}');
  const usuarioId = usuario?.data?.id || usuario?.id || usuario?.usuarioId;

  if (!usuarioId) {
    onResuelto?.();
    return;
  }

  this.ubicService.getUbicacionesPorUsuario(usuarioId).subscribe({
    next: (resp: any) => {
      const ubicacionesUsuario = Array.isArray(resp) ? resp : resp?.data ?? [];

      if (ubicacionesUsuario.length === 0) {
        onResuelto?.();
        return;
      }

      const ubicacion = ubicacionesUsuario[0];
      this.ubicacionUsuarioId = Number(ubicacion.id);
      this.ubicacionUsuarioNombre = ubicacion.nombre ?? '';

      if (ubicacion.escuelaId) {
        this.escuelaService.getEscuelaById(ubicacion.escuelaId).subscribe({
          next: (res: any) => {
            const escuela = res?.data ?? res;
            if (escuela?.nombre) this.escuelaNombreUsuario = escuela.nombre;
          },
          error: (err) => console.error(err)
        });
      }

      onResuelto?.();
    },
    error: (err) => {
      console.error(err);
      onResuelto?.();
    }
  });
}

listarSolicitantes(): void {
  this.solicitanteService.getSolicitantes().subscribe({
    next: (res: any) => {
      this.solicitantes = res.data ?? [];
      this.solicitantesFiltrados = this.solicitantes;
    }
  });
}
ngAfterViewInit(): void {
  // No hacemos nada si no hay referencia en HTML
}

async generarPrestamo(): Promise<void> {

  const prestamo = {
    articuloId: this.articuloId,
    solicitanteId: this.solicitanteId,
    nombreSolicitante: this.nombre,
    fechaPrestamo: this.fechaInicio
      ? new Date(this.fechaInicio).toISOString()
      : new Date().toISOString(),
    fechaDevolucion: this.fechaFin
      ? new Date(this.fechaFin).toISOString()
      : new Date().toISOString(),
    estado: 0,
    estadoPrestamo: true
  };

  this.prestamoService.addPrestamo(prestamo).subscribe({
    next: async (res: any) => {

      const pdfBlob = await this.generarPDFBlob();

      const formData = new FormData();
      formData.append('file', pdfBlob, 'prestamo.pdf');
      formData.append('prestamoId', String(res.data?.id ?? res.id));

      this.prestamoService.uploadPDF(formData).subscribe({
        next: () => {

          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Préstamo guardados correctamente',
             confirmButtonText: 'OK'

          }).then(() => {
            this.limpiarFormulario();
            this.router.navigate(['/prestamos']);
          });

        },
        error: (err) => {

          console.error(err);

          Swal.fire({
            icon: 'error',
            title: 'Error al subir PDF',
            text: err?.error?.message || 'Ocurrió un problema al guardar el PDF'
          });

        }
      });

    },
    error: (err) => {

      console.error(err);

      Swal.fire({
        icon: 'error',
        title: 'Error al crear préstamo',
        text: err?.error?.errors || 'No se pudo generar el préstamo'
      });

    }
  });
}

async generarPDFBlob(): Promise<Blob> {
  const element = this.documentoPDF.nativeElement;
  const canvas = await html2canvas(element, {
    scale: 2
  });

  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgProps = pdf.getImageProperties(imgData);

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  return pdf.output('blob'); // 🔥 importante
}
obtenerNombres(s: any): string {
  return s?.nombres ?? s?.Nombres ?? s?.nombre ?? s?.Nombre ?? '';
}

obtenerApellidos(s: any): string {
  return s?.apellidos ?? s?.Apellidos ?? s?.apellido ?? s?.Apellido ?? '';
}

filtrarSolicitantes(event: any): void {
  const value = event.target.value.toLowerCase();

  this.solicitantesFiltrados = this.solicitantes.filter(s =>
    (this.obtenerNombres(s) + ' ' + this.obtenerApellidos(s) + ' ' + (s.codigo ?? ''))
      .toLowerCase()
      .includes(value)
  );
}
seleccionarSolicitante(s: any): void {
  this.solicitanteSeleccionado = s;

  const nombres = this.obtenerNombres(s);
  const apellidos = this.obtenerApellidos(s);

  this.nombre = `${nombres} ${apellidos}`.trim();
  this.dni = s.dni ?? s.codigo ?? s.Codigo ?? '';
  this.ciclo = s.ciclo ?? s.Ciclo ?? '';
  this.correo = s.correo ?? s.Correo ?? '';

  this.telefono = s.telefono ?? s.Telefono ?? '';

  this.escuela = s.escuela ?? s.Escuela ?? '';
  this.direccion = s.direccion ?? s.Direccion ?? '';
    this.solicitanteId = s.id; // 👈 IMPORTANTE

}
cargarSolicitantes(): void {
  this.solicitanteService.getSolicitantes().subscribe({
    next: (response: any) => {
      this.solicitantes = response.data ?? response ?? [];
      this.solicitantesFiltrados = [...this.solicitantes];
    },
    error: (error) => console.error(error)
  });
}

abrirModalNuevoSolicitante(): void {
  // Asigna automáticamente la ubicación propia del usuario logueado
  const ubicacionId = this.ubicacionUsuarioId || (this.ubicaciones[0]?.id ?? 0);

  this.nuevoSolicitante = {
    nombres: '', apellidos: '', codigo: '',
    telefono: '', correo: '', cargo: '', ciclo: '',
    ubicacionId
  };
  this.cargoPersonalizadoNuevo = '';
  this.mostrarModalSolicitante = true;
}

cerrarModalNuevoSolicitante(): void {
  this.mostrarModalSolicitante = false;
}

onCargoNuevoChange(): void {
  if (this.nuevoSolicitante.cargo !== 'Estudiante') this.nuevoSolicitante.ciclo = '';
  if (this.nuevoSolicitante.cargo !== 'Otro') this.cargoPersonalizadoNuevo = '';
}

guardarNuevoSolicitante(): void {
  if (this.nuevoSolicitante.cargo === 'Otro') {
    if (!this.cargoPersonalizadoNuevo.trim()) {
      Swal.fire('Validación', 'Ingrese el cargo personalizado', 'warning'); return;
    }
    this.nuevoSolicitante.cargo = this.cargoPersonalizadoNuevo.trim();
  }

  if (!this.nuevoSolicitante.nombres.trim()) {
    Swal.fire('Validación', 'Ingrese los nombres', 'warning'); return;
  }
  if (!this.nuevoSolicitante.apellidos.trim()) {
    Swal.fire('Validación', 'Ingrese los apellidos', 'warning'); return;
  }
  if (!/^\d{8}$/.test(this.nuevoSolicitante.codigo)) {
    Swal.fire('Validación', 'El DNI debe tener 8 dígitos', 'warning'); return;
  }
  if (!/^\d{9}$/.test(this.nuevoSolicitante.telefono)) {
    Swal.fire('Validación', 'El teléfono debe tener 9 dígitos', 'warning'); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoSolicitante.correo)) {
    Swal.fire('Validación', 'Ingrese un correo válido', 'warning'); return;
  }
  if (!this.nuevoSolicitante.cargo) {
    Swal.fire('Validación', 'Seleccione un cargo', 'warning'); return;
  }

  this.solicitanteService.addSolicitante(this.nuevoSolicitante).subscribe({
    next: (res: any) => {
      Swal.fire('Registrado', 'Solicitante registrado correctamente', 'success');
      this.cerrarModalNuevoSolicitante();

      // Auto-seleccionar el solicitante recién creado
      const creado = res.data || res;
      const s = { ...this.nuevoSolicitante, id: creado?.id ?? creado?.Id ?? 0 };
      this.seleccionarSolicitante(s);
      this.nombreSolicitanteCtrl = `${s.nombres} ${s.apellidos}`;

      this.cargarSolicitantes();
    },
    error: (err) => {
      Swal.fire('Error', err?.error?.message || 'No se pudo registrar el solicitante', 'error');
    }
  });
}
listarArticulos(): void {

  this.articuloService.getArticulosConCampos().subscribe({
    next: (res: any) => {

      const data = Array.isArray(res)
        ? res
        : res?.data ?? [];

      const idsUbicaciones = [
        Number(this.ubicacionUsuarioId),
        100, // Otros — ubicación comodín sin padre asignado
        ...this.ubicaciones.map(
          (u: any) => Number(u.id)
        )
      ];

      console.log(
        '✅ IDS PERMITIDOS:',
        idsUbicaciones
      );

      this.articulos = data.filter((a: any) =>
        idsUbicaciones.includes(
          Number(a.ubicacionId)
        )
      );

      console.log(
        '📦 ARTICULOS FILTRADOS:',
        this.articulos
      );

    },
    error: (err) => {

      console.error(err);

      Swal.fire(
        'Error',
        'No se pudieron cargar los artículos',
        'error'
      );

    }
  });

}
  agregarParticipante(): void {

    if (!this.nuevoParticipante.nombre.trim()) {
      Swal.fire('Validación', 'Ingrese el nombre del participante', 'warning');
      return;
    }

    if (!/^\d{8}$/.test(this.nuevoParticipante.codigo)) {
      Swal.fire('Validación', 'El DNI/código debe tener 8 dígitos', 'warning');
      return;
    }

    if (!/^\d{9}$/.test(this.nuevoParticipante.telefono)) {
      Swal.fire('Validación', 'El teléfono debe tener 9 dígitos', 'warning');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.nuevoParticipante.correo)) {
      Swal.fire('Validación', 'Ingrese un correo válido', 'warning');
      return;
    }

    const yaExiste = this.participantes.some(
      p => p.codigo === this.nuevoParticipante.codigo
    );

    if (yaExiste) {
      Swal.fire('Validación', 'Ese DNI/código ya fue agregado como participante', 'warning');
      return;
    }

    this.participantes.push({

      nombre:
        this.nuevoParticipante.nombre,

      telefono:
        this.nuevoParticipante.telefono,

      codigo:
        this.nuevoParticipante.codigo,

      correo:
        this.nuevoParticipante.correo

    });

    this.nuevoParticipante = {

      nombre: '',
      telefono: '',
      codigo: '',
      correo: ''

    };
  }

  eliminarParticipante(
    index: number
  ): void {

    this.participantes.splice(
      index,
      1
    );
  }
seleccionarArticulo(id: number): void {

  const articulo = this.articulos.find(
    a => Number(a.id) === Number(id)
  );

  if (articulo) {
    this.equipo = articulo.nombre;
  } else {
    this.equipo = '';
  }

}

  imprimir(): void {

    window.print();
  }

  // =========================
  // LIMPIAR FORMULARIO
  // =========================

  limpiarFormulario(): void {

    this.equipo = '';

    this.destinatario = '';

    this.nombre = '';
    this.dni = '';
    this.ciclo = '';

    this.escuela = '';
    this.direccion = '';
    this.correo = '';

    this.actividad = '';

    this.lugarUso = '';

    this.detalle = '';

    this.fechaInicio = '';
    this.fechaFin = '';

    this.ciudad = '';

    this.fechaDocumento = '';

    this.participantes = [];

    this.nuevoParticipante = {

      nombre: '',
      telefono: '',
      codigo: '',
      correo: ''

    };
  }

  // =========================
  // UTILIDADES
  // =========================

  obtenerFechaFormateada(): string {

    if (!this.fechaDocumento) {

      return '';
    }

    const fecha =
      new Date(this.fechaDocumento);

    return fecha.toLocaleDateString(
      'es-PE',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
  }
}

