import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {

  constructor(private httpClient: HttpClient) {}

  public addUbicacion(ubicacion: any) {
    return this.httpClient.post(`${baseUrl}/ubicaciones`, ubicacion);
  }

  public updateUbicacion(id: number, ubicacion: any) {
    return this.httpClient.put(`${baseUrl}/ubicaciones/${id}`, ubicacion);
  }

  public asignarUsuario(ubicacionId: number, usuarioId: number) {
  return this.httpClient.put(
    `${baseUrl}/ubicaciones/${ubicacionId}/asignar-usuario`,
    { usuarioId }
  );
}

public getUbicacionesPorUsuario(usuarioId: number) {
  return this.httpClient.get<any[]>(`${baseUrl}/ubicaciones/usuario/${usuarioId}`);
}
public getUbicacionesPorPadre(padreId: number) {
  return this.httpClient.get<any[]>(
    `${baseUrl}/ubicaciones/por-padre/${padreId}`
  );
}
  public getUbicaciones() {
    return this.httpClient.get<any[]>(`${baseUrl}/ubicaciones`);
  }

  public getUbicacionById(id: number) {
    return this.httpClient.get(`${baseUrl}/ubicaciones/${id}`);
  }

  public deleteUbicacion(id: number) {
    return this.httpClient.delete(`${baseUrl}/ubicaciones/${id}`);
  }

  public getUbicacionesPorTipo(tipoId: number) {
    return this.httpClient.get<any[]>(`${baseUrl}/ubicaciones/por-tipo/${tipoId}`);
  }

  public getUbicacionesPorEscuela(escuelaId: number) {
    return this.httpClient.get<any>(`${baseUrl}/ubicaciones/por-escuela/${escuelaId}`);
  }
}
