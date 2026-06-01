import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {

  constructor(private httpClient: HttpClient) {}

  // CREATE con imagen
  addUbicacionForm(data: FormData) {
    return this.httpClient.post(`${baseUrl}/ubicaciones`, data);
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
  // UPDATE con imagen
  updateUbicacionForm(id: number, data: FormData) {
    return this.httpClient.put(`${baseUrl}/ubicaciones/${id}`, data);
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
}
