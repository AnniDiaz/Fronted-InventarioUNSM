import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {

   constructor(private httpClient:HttpClient) { }
  public addArticulo(loginData: any) {
    return this.httpClient.post(`${baseUrl}/articulo`, loginData);
  }

}
