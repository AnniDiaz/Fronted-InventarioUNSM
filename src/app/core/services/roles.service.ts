import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class RolesService {

  constructor(private httpClient: HttpClient) { }

  public addRol(rol: any) {
    return this.httpClient.post(`${baseUrl}/roles`, rol);
  }

  public getRoles() {
    return this.httpClient.get<any[]>(`${baseUrl}/roles`);
  }

  public getRolById(id: number) {
    return this.httpClient.get(`${baseUrl}/roles/${id}`);
  }

  public getRolByNombre(nombre: string) {
    return this.httpClient.get(`${baseUrl}/roles/nombre/${nombre}`);
  }

  public updateRol(id: number, rol: any) {
    return this.httpClient.put(`${baseUrl}/roles/${id}`, rol);
  }

  public deleteRol(id: number) {
    return this.httpClient.delete(`${baseUrl}/roles/${id}`);
  }

  public actualizarSubModulos(rolId: number, subModulosIds: number[]) {
  return this.httpClient.put(`${baseUrl}/rolsubmodulo/actualizar-submodulos/${rolId}`, subModulosIds);
}

}
