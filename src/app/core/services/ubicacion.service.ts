import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {

constructor(private httpClient:HttpClient) { }
  public addArticulo(loginData: any) {
    return this.httpClient.post(`${baseUrl}/TipoArticulo`, loginData);
  }
   // GET -> Obtener todos los artículos
  public getUbicaciones() {
    return this.httpClient.get(`${baseUrl}/ubicaciones`);
  }

}
