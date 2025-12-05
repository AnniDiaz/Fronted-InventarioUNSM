import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class PermisoService {

  constructor(private http: HttpClient) { }

  public getPermisos() {
    return this.http.get<any[]>(`${baseUrl}/permisos`);
  }

  public getPermisoById(id: number) {
    return this.http.get(`${baseUrl}/permisos/${id}`);
  }

  public addPermiso(permiso: any) {
    return this.http.post(`${baseUrl}/permisos`, permiso);
  }

  public updatePermiso(id: number, permiso: any) {
    return this.http.put(`${baseUrl}/permisos/${id}`, permiso);
  }

  public deletePermiso(id: number) {
    return this.http.delete(`${baseUrl}/permisos/${id}`);
  }
}
