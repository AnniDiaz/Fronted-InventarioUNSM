import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  constructor(private httpClient: HttpClient) { }

  // 🔹 Reporte: Artículos por ubicación
  public getArticulosPorUbicacion() {
    return this.httpClient.get<any[]>(`${baseUrl}/reportes/articulos-por-ubicacion`);
  }

  // 🔹 Reporte: Artículos por tipo
  public getArticulosPorTipo() {
    return this.httpClient.get<any[]>(`${baseUrl}/reportes/articulos-por-tipo`);
  }
}
