import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  constructor(private http: HttpClient) {}

  public getUsuarios() {
    return this.http.get<any[]>(`${baseUrl}/usuarios`);
  }
  public getUsuarioById(id: number) {
    return this.http.get(`${baseUrl}/usuarios/${id}`);
  }
  public addUsuario(usuario: any) {
    return this.http.post(`${baseUrl}/usuarios`, usuario);
  }
  public updateUsuario(id: number, usuario: any) {
    return this.http.put(`${baseUrl}/usuarios/${id}`, usuario);
  }
  public deleteUsuario(id: number) {
    return this.http.delete(`${baseUrl}/usuarios/${id}`);
  }

  public getUsuarioActual() {
    return this.http.get(`${baseUrl}/usuarios/usuario-actual`);
  }
}
