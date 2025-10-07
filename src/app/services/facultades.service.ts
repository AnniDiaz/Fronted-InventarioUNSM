// src/app/services/facultades.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import baseUrl from '../shared/components/helper';

export interface Facultad {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacultadesService {

  constructor(private httpClient: HttpClient) {}

  // GET -> Obtener todas las facultades
  public getFacultades(): Observable<Facultad[]> {
    return this.httpClient.get<Facultad[]>(`${baseUrl}/facultades`);
  }
}
