import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

export interface SubModulo {
  id: number;
  nombre: string;
  ruta: string;
  icon?: string;  
  moduloId: number;
}

export interface Modulo {
  id: number;
  nombre: string;
  ruta: string;
  icon?: string;  
  estado: number;
  subModulos: SubModulo[];
}

@Injectable({
  providedIn: 'root'
})
export class ModulosService {

  constructor(private httpClient: HttpClient) { }

  public getModulos(): Observable<Modulo[]> {
    return this.httpClient.get<Modulo[]>(`${baseUrl}/modulos`);
  }

  public getModuloById(id: number): Observable<Modulo> {
    return this.httpClient.get<Modulo>(`${baseUrl}/modulos/${id}`);
  }

  public searchModulos(nombre: string): Observable<Modulo[]> {
    return this.httpClient.get<Modulo[]>(`${baseUrl}/modulos/buscar?nombre=${nombre}`);
  }

  public addModulo(modulo: any) {
    return this.httpClient.post(`${baseUrl}/modulos`, modulo);
  }

  public updateModulo(id: number, modulo: any) {
    return this.httpClient.put(`${baseUrl}/modulos/${id}`, modulo);
  }

  public deleteModulo(id: number) {
    return this.httpClient.delete(`${baseUrl}/modulos/${id}`);
  }

  public getSubModulosByRol(rolId: number): Observable<any[]> {
    return this.httpClient.get<any[]>(`${baseUrl}/RolSubModulo/rol/${rolId}`);
  }

}
