// src/app/services/facultades.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Facultad {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacultadesService {

  constructor(private httpClient: HttpClient) {}

  //
}
