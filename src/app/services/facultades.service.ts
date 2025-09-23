// src/app/services/pisos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Piso } from '../features/pisos/models/piso.model';
import { environment } from '../../environments/environment';
import { Facultades } from '../features/pisos/models/facultades.model';


@Injectable({
  providedIn: 'root'
})
export class FacultadesService {
  private apiUrl = `${environment.apiUrl}/facultades`; 

  constructor(private http: HttpClient) {}

  getFacultades(): Observable<Facultades[]> {
    return this.http.get<Facultades[]>(this.apiUrl);
  }

}
