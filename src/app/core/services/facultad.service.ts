import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class FacultadService {

  constructor(private httpClient: HttpClient) { }

  public getFacultades() {
    return this.httpClient.get<any[]>(`${baseUrl}/Facultades/detalle`);
  }

  public getFacultadById(id: number) {
    return this.httpClient.get(`${baseUrl}/Facultades/${id}`);
  }

  public addFacultad(facultad: any) {
    return this.httpClient.post(`${baseUrl}/Facultades`, facultad);
  }

  public updateFacultad(id: number, facultad: any) {
    return this.httpClient.put(`${baseUrl}/Facultades/${id}`, facultad);
  }

  public deleteFacultad(id: number) {
    return this.httpClient.delete(`${baseUrl}/Facultades/${id}`);
  }

  public asignarUsuario(id: number, usuarioId: number) {
    return this.httpClient.put(`${baseUrl}/Facultades/${id}/asignar-usuario`, { usuarioId });
  }

}
