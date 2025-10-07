import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {

  constructor(private httpClient: HttpClient) { }

  public addUbicacion(ubicacion: any) {
    return this.httpClient.post(`${baseUrl}/ubicaciones`, ubicacion);
  }

  public getUbicaciones() {
    return this.httpClient.get<any[]>(`${baseUrl}/ubicaciones`);
  }

  public getUbicacionById(id: number) {
    return this.httpClient.get(`${baseUrl}/ubicaciones/${id}`);
  }

  public updateUbicacion(id: number, ubicacion: any) {
    return this.httpClient.put(`${baseUrl}/ubicaciones/${id}`, ubicacion);
  }

  public deleteUbicacion(id: number) {
    return this.httpClient.delete(`${baseUrl}/ubicaciones/${id}`);
  }

}
