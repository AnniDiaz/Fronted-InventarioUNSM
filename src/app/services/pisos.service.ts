// src/app/services/pisos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import baseUrl from '../shared/components/helper';

export interface Piso {
  id: number;
  numero: number;
  facultadId: number; // relación con la facultad
}

@Injectable({
  providedIn: 'root'
})
export class PisosService {

  constructor(private httpClient: HttpClient) {}

  // GET -> Obtener todos los pisos
  public getPisos(): Observable<Piso[]> {
    return this.httpClient.get<Piso[]>(`${baseUrl}/pisos`);
  }

  // GET -> Obtener un piso por ID
  public getPiso(id: number): Observable<Piso> {
    return this.httpClient.get<Piso>(`${baseUrl}/pisos/${id}`);
  }

  // POST -> Crear un piso
  public createPiso(piso: Partial<Piso>): Observable<Piso> {
    return this.httpClient.post<Piso>(`${baseUrl}/pisos`, piso);
  }

  // PUT -> Actualizar un piso
  public updatePiso(id: number, piso: Partial<Piso>): Observable<Piso> {
    return this.httpClient.put<Piso>(`${baseUrl}/pisos/${id}`, piso);
  }

  // DELETE -> Eliminar un piso
  public deletePiso(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${baseUrl}/pisos/${id}`);
  }
}
