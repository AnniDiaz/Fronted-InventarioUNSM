import { Component, ChangeDetectorRef } from '@angular/core';
import { RolesService } from '../../core/services/roles.service';
import { ModulosService } from '../../core/services/modulos.service';
import Swal from 'sweetalert2';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermisoService } from '../../core/services/permisos.service';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-roles',
  imports: [HeaderComponent, SidebarComponent, FormsModule, CommonModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent {

  filtro: string = '';
  roles: any[] = [];
  rolesFiltrados: any[] = [];

  mostrarFormulario: boolean = false;
  editando: boolean = false;

  paginaActual: number = 1;
  registrosPorPagina: number = 12;

  modulos: any[] = [];
  subModulosSeleccionados: number[] = [];
permisos: any[] = [];
permisosSeleccionados: any[] = [];
  nuevoRol = {
    id: 0,
    nombre: '',
    estado: 1
  };

constructor(
  private rolesService: RolesService,
  private modulosService: ModulosService,
  private permisoService: PermisoService,
  private cdr: ChangeDetectorRef
) {}

ngOnInit(): void {
  this.cargarRoles();
  this.cargarModulos();
  this.cargarPermisos();
}

cargarPermisos() {
  this.permisoService.getPermisos().subscribe({
    next: (resp: any) => {
      this.permisos = resp.data.filter((p:any)=>p.activo);
    }
  });
}

  // 🔥 ASIGNAR PERMISOS (MEJORADO)
  asignarPermisos(rol: any) {
    this.nuevoRol = { ...rol };
    this.editando = true;

    this.mostrarFormulario = true;

    // limpiar selección
    this.subModulosSeleccionados = [];

    // 🔥 recargar módulos correctamente
    this.cargarModulos();

    // 🔥 traer permisos reales del backend
    this.modulosService.getSubModulosByRol(rol.id).subscribe({
      next: (data: any[]) => {
        this.subModulosSeleccionados = data.map(s => s.subModuloId);
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error permisos:", err)
    });
  }
togglePermiso(subModuloId: number | null, moduloId: number, permisoId: number, event: any) {

  const key = `${moduloId}-${subModuloId || 0}-${permisoId}`;

  if (event.target.checked) {
    if (!this.permisosSeleccionados.includes(key)) {
      this.permisosSeleccionados.push(key);
    }
  } else {
    this.permisosSeleccionados = this.permisosSeleccionados.filter(x => x !== key);
  }
}
armarPayloadPermisos() {
  return this.permisosSeleccionados.map((key: string) => {

    const [moduloId, subModuloId, permisoId] = key.split('-');

    const subId = Number(subModuloId);

    return {
      id: 0,
      rolId: this.nuevoRol.id,

      // 🔥 CLAVE: si hay submódulo → NO enviar módulo
      moduloId: subId === 0 ? Number(moduloId) : null,

      subModuloId: subId === 0 ? null : subId,

      permisoId: Number(permisoId)
    };

  });
}
estaSubModuloCompleto(sub: any, modulo: any): boolean {
  return this.permisos.every(p =>
    this.tienePermiso(sub.id, modulo.id, p.id)
  );
}
toggleModuloPermisos(modulo: any, event: any) {
  const checked = event.target.checked;

  if (!modulo.subModulos || modulo.subModulos.length === 0) {

    // módulo sin submódulos
    this.permisos.forEach(p => {
      const key = `${modulo.id}-0-${p.id}`;

      if (checked) {
        if (!this.permisosSeleccionados.includes(key)) {
          this.permisosSeleccionados.push(key);
        }
      } else {
        this.permisosSeleccionados = this.permisosSeleccionados.filter(x => x !== key);
      }
    });

  } else {

    // módulo con submódulos
    modulo.subModulos.forEach((sub: any) => {
      this.permisos.forEach((p: any) => {
        const key = `${modulo.id}-${sub.id}-${p.id}`;

        if (checked) {
          if (!this.permisosSeleccionados.includes(key)) {
            this.permisosSeleccionados.push(key);
          }
        } else {
          this.permisosSeleccionados = this.permisosSeleccionados.filter(x => x !== key);
        }
      });
    });

  }
}
toggleSubModuloCompleto(sub: any, modulo: any, event: any) {
  const checked = event.target.checked;

  this.permisos.forEach(p => {
    const key = `${modulo.id}-${sub.id}-${p.id}`;

    if (checked) {
      if (!this.permisosSeleccionados.includes(key)) {
        this.permisosSeleccionados.push(key);
      }
    } else {
      this.permisosSeleccionados = this.permisosSeleccionados.filter(x => x !== key);
    }
  });
}
tienePermiso(subModuloId: number | null, moduloId: number, permisoId: number) {
  return this.permisosSeleccionados.includes(
    `${moduloId}-${subModuloId || 0}-${permisoId}`
  );
}
  cargarRoles() {
    this.rolesService.getRoles().subscribe({
      next: (resp: any) => {
        console.log("RESPUESTA COMPLETA:", resp);
        this.roles = resp.data;
        this.aplicarFiltro();
      },
      error: (err) => console.error("Error al obtener roles", err)
    });
  }

  // 🔥 CORREGIDO (CLAVE)
  cargarModulos() {
    this.modulosService.getModulos().subscribe({
      next: (resp: any) => {
        console.log("MODULOS:", resp);

        this.modulos = resp.data.map((m: any) => ({
          ...m,
          expandido: false,
          subModulos: m.subModulos || []
        }));

        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar módulos", err)
    });
  }

  aplicarFiltro() {
    const texto = this.filtro.trim().toLowerCase();
    this.rolesFiltrados = texto
      ? this.roles.filter(r => r.nombre.toLowerCase().includes(texto))
      : this.roles;
    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(this.rolesFiltrados.length / this.registrosPorPagina);
  }

  get registrosPaginados() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.rolesFiltrados.slice(inicio, inicio + this.registrosPorPagina);
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;

    if (!this.mostrarFormulario) {
      this.nuevoRol = { id: 0, nombre: '', estado: 1 };
      this.subModulosSeleccionados = [];
      this.editando = false;
    } else if (!this.editando) {
      this.subModulosSeleccionados = [];
    }
  }

  toggleSubModulo(id: number, event: any) {
    if (event.target.checked) {
      if (!this.subModulosSeleccionados.includes(id)) {
        this.subModulosSeleccionados.push(id);
      }
    } else {
      this.subModulosSeleccionados = this.subModulosSeleccionados.filter(x => x !== id);
    }
  }

  toggleModuloCompleto(modulo: any, event: any) {
    if (event.target.checked) {
      modulo.subModulos.forEach((s: any) => {
        if (!this.subModulosSeleccionados.includes(s.id)) {
          this.subModulosSeleccionados.push(s.id);
        }
      });
    } else {
      modulo.subModulos.forEach((s: any) => {
        this.subModulosSeleccionados = this.subModulosSeleccionados.filter(x => x !== s.id);
      });
    }
  }

  estaModuloCompleto(modulo: any): boolean {
    if (!modulo.subModulos || modulo.subModulos.length === 0) return false;
    return modulo.subModulos.every((s: any) => this.subModulosSeleccionados.includes(s.id));
  }

guardarRol() {

  if (!this.nuevoRol.nombre.trim()) {
    Swal.fire('Error', 'El nombre del rol no puede estar vacío.', 'error');
    return;
  }

  const payloadRol = {
    id: this.nuevoRol.id,
    nombre: this.nuevoRol.nombre,
    estado: this.nuevoRol.estado
  };

  // 🔥 GENERAR PERMISOS
  const permisosPayload = this.armarPayloadPermisos();

if (this.editando) {

  this.rolesService.updateRol(this.nuevoRol.id, payloadRol).subscribe({
    next: () => {

      // 🔥 USAR SYNC (LA CLAVE)
      this.rolesService.syncPermisos(this.nuevoRol.id, permisosPayload).subscribe({
        next: () => {
          this.cargarRoles();
          this.toggleFormulario();

          Swal.fire('¡Actualizado!', 'Permisos sincronizados correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'Error al sincronizar permisos.', 'error')
      });

    },
    error: () => Swal.fire('Error', 'No se pudo actualizar el rol.', 'error')
  });

}else {

    this.rolesService.addRol(payloadRol).subscribe({
      next: (res: any) => {

const rolId = res.data.id;        this.nuevoRol.id = rolId;

        // 🔥 ACTUALIZAR rolId en payload
        const permisosFinal = permisosPayload.map(p => ({
          ...p,
          rolId
        }));

        this.rolesService.addRolPermisos(permisosFinal).subscribe({
          next: () => {
            this.cargarRoles();
            this.toggleFormulario();

            Swal.fire('¡Creado!', 'Rol y permisos guardados.', 'success');
          },
          error: () => Swal.fire('Error', 'Error al guardar permisos.', 'error')
        });

      },
      error: () => Swal.fire('Error', 'Ya existe un rol con ese nombre.', 'error')
    });

  }
}
editarRol(rol: any) {
  this.nuevoRol = { id: rol.id, nombre: rol.nombre, estado: rol.estado };
  this.editando = true;
  this.mostrarFormulario = true;

  this.permisosSeleccionados = [];

  forkJoin({
    permisos: this.permisoService.getPermisos(),
    modulos: this.modulosService.getModulos(),
    permisosRol: this.modulosService.getSubModulosByRol(rol.id)
  }).subscribe({
    next: (resp: any) => {

      // 🔥 1. cargar permisos
      this.permisos = resp.permisos.data.filter((p:any)=>p.activo);

      // 🔥 2. cargar módulos
      this.modulos = resp.modulos.data.map((m: any) => ({
        ...m,
        expandido: true, // opcional para verlos abiertos
        subModulos: m.subModulos || []
      }));

      // 🔥 3. mapear permisos del rol
      const modulosRol = resp.permisosRol.data.modulos || [];

      modulosRol.forEach((mod: any) => {

        // SIN SUBMODULOS
        if (!mod.subModulos || mod.subModulos.length === 0) {

          mod.permisos?.forEach((permNombre: string) => {

const permiso = this.permisos.find(p =>
  p.nombre.toLowerCase() === permNombre.toLowerCase()
);
            if (permiso) {
              const key = `${mod.id}-0-${permiso.id}`;
              this.permisosSeleccionados.push(key);
            }

          });

        }

        // CON SUBMODULOS
        mod.subModulos?.forEach((sub: any) => {

          sub.permisos?.forEach((permNombre: string) => {

            const permiso = this.permisos.find(p => p.nombre === permNombre);

            if (permiso) {
              const key = `${mod.id}-${sub.id}-${permiso.id}`;
              this.permisosSeleccionados.push(key);
            }

          });

        });

      });

      this.cdr.detectChanges();
    },
    error: (err) => console.error("Error:", err)
  });
}

  eliminarRol(id: number) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rolesService.deleteRol(id).subscribe({
          next: () => {
            this.roles = this.roles.filter(r => r.id !== id);
            this.aplicarFiltro();
            Swal.fire('¡Eliminado!', 'El rol ha sido eliminado.', 'success');
          }
        });
      }
    });
  }
}
