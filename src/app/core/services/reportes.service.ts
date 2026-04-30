import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

export interface ReporteRequest {
  fechaInicio?: string;
  fechaFin?: string;
  ubicacionId?: number;
  ubicacionOrigenId?: number;
  ubicacionDestinoId?: number;
  categoriaId?: number;
  estado?: string;
  tipo: number; // 0=Inv, 1=Prestamos, 2=Mantenimiento, 3=Traslados
}

export interface ReporteResponse {
  kpis: any[];
  grafico: {
    labels: string[];
    valores: number[];
  };
  tabla: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  constructor(private httpClient: HttpClient) { }

  // 🔹 Generar reporte unificado desde el backend
  public generarReporte(filtros: ReporteRequest): Observable<ReporteResponse> {
    return this.httpClient.post<ReporteResponse>(`${baseUrl}/Reportes/generar`, filtros);
  }

  // Métodos antiguos (opcionales para retrocompatibilidad si se desea, pero el nuevo es el principal)
  public getArticulosPorUbicacion() {
    return this.httpClient.get<any[]>(`${baseUrl}/reportes/articulos-por-ubicacion`);
  }

  public getArticulosPorTipo() {
    return this.httpClient.get<any[]>(`${baseUrl}/reportes/articulos-por-tipo`);
  }
}
