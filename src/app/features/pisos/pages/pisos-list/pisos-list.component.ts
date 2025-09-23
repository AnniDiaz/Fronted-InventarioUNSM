import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { Piso } from '../../models/piso.model';
import { PisosService } from '../../../../services/pisos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Facultades } from '../../models/facultades.model';
import { FacultadesService } from '../../../../services/facultades.service';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-pisos-list',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './pisos-list.component.html',
  styleUrls: ['./pisos-list.component.css'],
})
export class PisosListComponent implements OnInit, OnDestroy {
  pisos: Piso[] = [];
  facultades: Facultades[] = [];
  searchTerm: string = '';

  // Paginación
  page: number = 1; // Página actual
  itemsPerPage: number = 5; // Registros por página

  piso: Piso = { id: 0, numero: 0, facultadId: 0 } as Piso;

  loading: boolean = false;
  error: string = '';
  isEdit: boolean = false;
  modalOpen: boolean = false;

  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  constructor(
    private pisosService: PisosService,
    private facultadService: FacultadesService
  ) {}

  ngOnInit(): void {
    this.getPisos();
    this.getFacultades();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  getPisos(): void {
    this.loading = true;
    this.pisosService.getPisos().subscribe({
      next: (data) => {
        this.pisos = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar los pisos';
        this.loading = false;
        console.error(err);
      },
    });
  }

  getFacultades(): void {
    this.facultadService.getFacultades().subscribe({
      next: (data) => (this.facultades = data),
      error: (err) => console.error('Error al cargar facultades', err),
    });
  }

  openModal(edit: boolean = false) {
    this.isEdit = edit;
    if (!edit) this.resetForm();
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      try {
        this.firstInput?.nativeElement?.focus();
      } catch (e) {}
    }, 0);
  }

  closeModal() {
    this.modalOpen = false;
    document.body.style.overflow = '';
  }

  onEditPiso(p: Piso) {
    this.piso = { ...p };
    this.openModal(true);
  }

  savePiso(): void {
    if (this.isEdit) {
      this.pisosService.updatePiso(this.piso.id, this.piso).subscribe({
        next: () => {
          this.getPisos();
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          alert('Error al actualizar piso');
        },
      });
    } else {
      this.pisosService.createPiso(this.piso).subscribe({
        next: (nuevo) => {
          this.pisos.push(nuevo);
          this.closeModal();
        },
        error: (err) => {
          console.error(err);
          alert('Error al crear piso');
        },
      });
    }
  }

  deletePiso(id: number): void {
    if (!confirm('¿Seguro que quieres eliminar este piso?')) return;
    this.pisosService.deletePiso(id).subscribe({
      next: () => (this.pisos = this.pisos.filter((p) => p.id !== id)),
      error: (err) => console.error(err),
    });
  }

  resetForm(): void {
    this.piso = { id: 0, numero: 0, facultadId: 0 } as Piso;
    this.isEdit = false;
  }

  // Filtrado de búsqueda antes de paginar
  get filteredPisos(): Piso[] {
    let result = this.pisos;

    if (this.searchTerm) {
      result = result.filter((p) =>
        (p.numero ?? '')
          .toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase())
      );
    }

    return result;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent) {
    if (this.modalOpen) this.closeModal();
  }
}
