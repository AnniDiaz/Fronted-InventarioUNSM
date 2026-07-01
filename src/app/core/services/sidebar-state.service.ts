import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarStateService {
  private _abierto = new BehaviorSubject<boolean>(false);
  abierto$ = this._abierto.asObservable();

  toggle() { this._abierto.next(!this._abierto.getValue()); }
  close() { this._abierto.next(false); }
}
