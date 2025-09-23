import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class TipoArticulosService {

   constructor(private httpClient:HttpClient) { }
  public addTipoArticulo(loginData: any) {
    return this.httpClient.post(`${baseUrl}/tipo-articulo`, loginData);
  }
   // GET -> Obtener todos los artículos
  public getTipoArticulo() {
    return this.httpClient.get(`${baseUrl}/tipo-articulo`);
  }
  // GET -> Obtener todos los artículos de un tipo específico
  public getArticulosByTipo(id: number) {
    return this.httpClient.get(`${baseUrl}/tipo-articulo/${id}/articulo`);
  }
}
