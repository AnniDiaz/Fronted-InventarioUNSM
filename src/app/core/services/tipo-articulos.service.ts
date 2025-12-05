import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class TipoArticuloService {

  constructor(private httpClient: HttpClient) { }

  public addTipoArticulo(tipoArticulo: any) {
    return this.httpClient.post(`${baseUrl}/tipo-articulo`, tipoArticulo);
  }

  public getTipoArticulos() {
    return this.httpClient.get<any[]>(`${baseUrl}/tipo-articulo`);
  }

  public getTipoArticuloById(id: number) {
    return this.httpClient.get(`${baseUrl}/tipo-articulo/${id}`);
  }

  public updateTipoArticulo(id: number, tipoArticulo: any) {
    return this.httpClient.put(`${baseUrl}/tipo-articulo/${id}`, tipoArticulo);
  }

  public deleteTipoArticulo(id: number) {
    return this.httpClient.delete(`${baseUrl}/tipo-articulo/${id}`);
  }

  public getArticulosByTipo(id: number) {
    return this.httpClient.get(`${baseUrl}/tipo-articulo/${id}/articulo`);
  }
}
