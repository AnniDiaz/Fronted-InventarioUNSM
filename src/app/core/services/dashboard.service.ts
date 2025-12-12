import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private httpClient: HttpClient) { }

  public getArticulosPorUbicacion() {
    return this.httpClient.get<any[]>(`${baseUrl}/reportes/articulos-por-ubicacion`);
  }

  public getArticulosPorTipo() {
    return this.httpClient.get<any[]>(`${baseUrl}/reportes/articulos-por-tipo`);
  }
}
