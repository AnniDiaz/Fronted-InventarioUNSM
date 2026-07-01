import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class EscuelaService {

  constructor(private httpClient: HttpClient) { }

  public getEscuelas() {
    return this.httpClient.get<any[]>(`${baseUrl}/Escuelas`);
  }

  public getEscuelaById(id: number) {
    return this.httpClient.get(`${baseUrl}/Escuelas/${id}`);
  }

  public addEscuela(escuela: any) {
    return this.httpClient.post(`${baseUrl}/Escuelas`, escuela);
  }

  public updateEscuela(id: number, escuela: any) {
    return this.httpClient.put(`${baseUrl}/Escuelas/${id}`, escuela);
  }

  public deleteEscuela(id: number) {
    return this.httpClient.delete(`${baseUrl}/Escuelas/${id}`);
  }

  public asignarUsuario(id: number, usuarioId: number) {
    return this.httpClient.put(`${baseUrl}/Escuelas/${id}/asignar-usuario`, { usuarioId });
  }

  public getEscuelaPorUsuario(usuarioId: number) {
    return this.httpClient.get<any>(`${baseUrl}/Escuelas/usuario/${usuarioId}`);
  }

}
