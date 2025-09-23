// src/app/services/pisos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Piso } from '../features/pisos/models/piso.model';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PisosService {
  private apiUrl = `${environment.apiUrl}/pisos`; 

  constructor(private http: HttpClient) {}

  getPisos(): Observable<Piso[]> {
    return this.http.get<Piso[]>(this.apiUrl);
  }

  getPiso(id: number): Observable<Piso> {
    return this.http.get<Piso>(`${this.apiUrl}/${id}`);
  }

  createPiso(piso: Partial<Piso>): Observable<Piso> {
    return this.http.post<Piso>(this.apiUrl, piso);
  }

  updatePiso(id: number, piso: Partial<Piso>): Observable<Piso> {
    return this.http.put<Piso>(`${this.apiUrl}/${id}`, piso);
  }

  deletePiso(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
