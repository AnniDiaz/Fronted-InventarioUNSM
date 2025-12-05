import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class ArticuloService {

  constructor(private http: HttpClient) { }

  public getArticulos() {
    return this.http.get<any[]>(`${baseUrl}/articulos`);
  }

  public getArticuloById(id: number) {
    return this.http.get<any>(`${baseUrl}/articulos/${id}`);
  }

  public getArticulosByTipo(tipoArticuloId: number) {
    return this.http.get<any[]>(`${baseUrl}/articulos/tipo/${tipoArticuloId}`);
  }

  public getArticulosByUbicacion(ubicacionId: number) {
    return this.http.get<any[]>(`${baseUrl}/articulos/ubicacion/${ubicacionId}`);
  }

  public addArticulo(articulo: any) {
    return this.http.post(`${baseUrl}/articulos`, articulo);
  }

  public addArticuloConCampos(articuloCompleto: any) {
    return this.http.post(`${baseUrl}/articulos/crear-con-campos`, articuloCompleto);
  }

  public updateArticuloConCampos(articuloCompleto: any) {
    return this.http.put(`${baseUrl}/articulos/update-con-campos/${articuloCompleto.id}`, articuloCompleto);
  }

  public updateArticulo(id: number, articulo: any) {
    return this.http.put(`${baseUrl}/articulos/${id}`, articulo);
  }

  public deleteArticulo(id: number) {
    return this.http.delete(`${baseUrl}/articulos/${id}`);
  }

  public getPivotPorTipo(tipoArticuloId: number) {
    return this.http.get<any[]>(`${baseUrl}/articulos/pivot/tipo/${tipoArticuloId}`);
  }
}
