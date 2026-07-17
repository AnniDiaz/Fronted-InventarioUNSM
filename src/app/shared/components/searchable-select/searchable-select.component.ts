import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface OpcionSelect {
  value: any;
  label: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor, OnChanges {
  @Input() opciones: OpcionSelect[] = [];
  @Input() placeholder = 'Seleccione...';
  @Input() disabled = false;

  abierto = false;
  filtro = '';
  valor: any = null;
  textoMostrado = '';
  opcionesFiltradas: OpcionSelect[] = [];

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['opciones']) {
      this.actualizarFiltro();
      this.actualizarTextoMostrado();
    }
  }

  trackByValue(index: number, op: OpcionSelect): any {
    return op.value;
  }

  private actualizarFiltro(): void {
    const termino = this.filtro.trim().toLowerCase();
    this.opcionesFiltradas = termino
      ? this.opciones.filter(o => o.label.toLowerCase().includes(termino))
      : this.opciones;
  }

  private actualizarTextoMostrado(): void {
    if (this.abierto) {
      this.textoMostrado = this.filtro;
      return;
    }
    const seleccionado = this.opciones.find(o => o.value === this.valor);
    this.textoMostrado = seleccionado ? seleccionado.label : '';
  }

  abrir(): void {
    if (this.disabled) return;
    this.abierto = true;
    this.filtro = '';
    this.actualizarFiltro();
    this.actualizarTextoMostrado();
    this.cdr.markForCheck();
  }

  seleccionar(op: OpcionSelect): void {
    this.valor = op.value;
    this.onChange(this.valor);
    this.onTouched();
    this.abierto = false;
    this.filtro = '';
    this.actualizarTextoMostrado();
    this.cdr.markForCheck();
  }

  onInput(valor: string): void {
    this.filtro = valor;
    this.abierto = true;
    this.actualizarFiltro();
    this.actualizarTextoMostrado();
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.abierto = false;
      this.filtro = '';
      this.actualizarTextoMostrado();
      this.cdr.markForCheck();
    }
  }

  writeValue(value: any): void {
    this.valor = value;
    this.actualizarTextoMostrado();
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }
}
