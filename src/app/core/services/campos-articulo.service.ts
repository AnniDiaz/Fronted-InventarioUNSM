import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class CamposArticuloService {

  constructor(private http: HttpClient) {}

  public getCampos() {
    return this.http.get<any[]>(`${baseUrl}/campos-articulo`);
  }

  public getCampoById(id: number) {
    return this.http.get<any>(`${baseUrl}/campos-articulo/${id}`);
  }

  public getCamposByTipoArticulo(tipoArticuloId: number) {
    return this.http.get<any[]>(`${baseUrl}/campos-articulo/tipo-articulo/${tipoArticuloId}`);
  }

  public addCampo(campo: any) {
    return this.http.post(`${baseUrl}/campos-articulo`, campo);
  }

  public addCamposLote(campos: any[]) {
    return this.http.post(`${baseUrl}/campos-articulo/lote`, campos);
  }

  public updateCampo(id: number, campo: any) {
    return this.http.put(`${baseUrl}/campos-articulo/${id}`, campo);
  }

  public deleteCampo(id: number) {
    return this.http.delete(`${baseUrl}/campos-articulo/${id}`);
  }
}
