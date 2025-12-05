import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class ArticuloCampoValorService {

  constructor(private http: HttpClient) {}

  public getValores() {
    return this.http.get<any[]>(`${baseUrl}/articulocampovalor`);
  }

  public getValorById(id: number) {
    return this.http.get<any>(`${baseUrl}/articulocampovalor/${id}`);
  }

  public getValoresByTipoArticulo(tipoArticuloId: number) {
    return this.http.get<any[]>(`${baseUrl}/articulocampovalor/tipo-articulos/${tipoArticuloId}`);
  }

  public addValor(valor: any) {
    return this.http.post(`${baseUrl}/articulocampovalor`, valor);
  }

  public updateValor(id: number, valor: any) {
    return this.http.put(`${baseUrl}/articulocampovalor/${id}`, valor);
  }

  public deleteValor(id: number) {
    return this.http.delete(`${baseUrl}/articulocampovalor/${id}`);
  }
}
