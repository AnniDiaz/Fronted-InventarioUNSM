import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
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
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() opciones: OpcionSelect[] = [];
  @Input() placeholder = 'Seleccione...';
  @Input() disabled = false;

  abierto = false;
  filtro = '';
  valor: any = null;

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elRef: ElementRef) {}

  get opcionesFiltradas(): OpcionSelect[] {
    if (!this.filtro.trim()) return this.opciones;
    const termino = this.filtro.toLowerCase().trim();
    return this.opciones.filter(o => o.label.toLowerCase().includes(termino));
  }

  get textoMostrado(): string {
    if (this.abierto) return this.filtro;
    const seleccionado = this.opciones.find(o => o.value === this.valor);
    return seleccionado ? seleccionado.label : '';
  }

  abrir(): void {
    if (this.disabled) return;
    this.abierto = true;
    this.filtro = '';
  }

  seleccionar(op: OpcionSelect): void {
    this.valor = op.value;
    this.onChange(this.valor);
    this.onTouched();
    this.abierto = false;
    this.filtro = '';
  }

  onInput(valor: string): void {
    this.filtro = valor;
    this.abierto = true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.abierto = false;
      this.filtro = '';
    }
  }

  writeValue(value: any): void {
    this.valor = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
