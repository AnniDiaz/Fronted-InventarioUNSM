import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import baseUrl from '../../shared/components/helper';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // BehaviorSubject para mantener y emitir el usuario actual
  private usuarioSubject = new BehaviorSubject<any | null>(this.getUser());
  public usuario$ = this.usuarioSubject.asObservable();

  constructor(private httpClient: HttpClient) { }

  // -----------------------------------
  // Autenticación y login
  // -----------------------------------
  public generarToken(loginData: any): Observable<any> {
    return this.httpClient.post(`${baseUrl}/Auth/login`, loginData);
  }

  public loginUser(token: string): void {
    localStorage.setItem('token', token);
  }

  public isLoggedIn(): boolean {
    const tokenStr = localStorage.getItem('token');
    return !!tokenStr;
  }

  // -----------------------------------
  // Usuario actual
  // -----------------------------------
  public setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.usuarioSubject.next(user); // Notifica a todos los suscriptores
  }

  public getUser(): any | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    } else {
      this.logout();
      return null;
    }
  }

  // Actualiza solo la imagen o cualquier cambio del usuario
  public actualizarUsuario(usuario: any): void {
    this.setUser(usuario); // Actualiza localStorage y notifica al header
  }

  // -----------------------------------
  // Logout
  // -----------------------------------
  public logout(): boolean {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.usuarioSubject.next(null); // Notifica que no hay usuario
    return true;
  }

  // -----------------------------------
  // Token
  // -----------------------------------
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  // -----------------------------------
  // Roles
  // -----------------------------------
  public getUserRole(): string | null {
    const user = this.getUser();
    if (user?.rol?.nombreRol) {
      return user.rol.nombreRol;
    }
    return null;
  }

  // -----------------------------------
  // Llamadas al backend
  // -----------------------------------
  public getCurrentUser(): Observable<any> {
    const token = this.getToken();
    if (!token) throw new Error("No se encontró token. Usuario no autenticado.");

    return this.httpClient.get(`${baseUrl}/usuarios/usuario-actual`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  public enviarEmail(email: string): Observable<any> {
    return this.httpClient.post(`${baseUrl}/enviar-link-recuperacion`, { email }, { responseType: 'text' });
  }

  public resetPassword(token: string, nuevaClave: string): Observable<any> {
    return this.httpClient.post(`${baseUrl}/reset-password`, { token, nuevaClave }, { responseType: 'text' });
  }

  // -----------------------------------
  // Actualizar imagen del usuario
  // -----------------------------------
  public actualizarImagen(imagen: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', imagen);
    return this.httpClient.patch(`${baseUrl}/usuarios/actualizar-imagen`, formData);
  }
}
