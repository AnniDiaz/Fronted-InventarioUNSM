import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class TipoUbicacionService {

  constructor(private httpClient: HttpClient) { }

  public addTipoUbicacion(tipoUbicacion: any) {
    return this.httpClient.post(`${baseUrl}/tipo-ubicacion`, tipoUbicacion);
  }

  public getTipoUbicaciones() {
  return this.httpClient.get<any[]>(`${baseUrl}/tipo-ubicacion`);
}

  public getTipoUbicacionById(id: number) {
    return this.httpClient.get(`${baseUrl}/tipo-ubicacion/${id}`);
  }

  public updateTipoUbicacion(id: number, tipoUbicacion: any) {
    return this.httpClient.put(`${baseUrl}/tipo-ubicacion/${id}`, tipoUbicacion);
  }

  public deleteTipoUbicacion(id: number) {
    return this.httpClient.delete(`${baseUrl}/tipo-ubicacion/${id}`);
  }

}
