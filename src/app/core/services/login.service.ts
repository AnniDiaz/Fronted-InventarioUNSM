import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import baseUrl from '../../shared/components/helper';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // BehaviorSubject para mantener y emitir el usuario actual
  private usuarioSubject = new BehaviorSubject<any | null>(null);
  public usuario$ = this.usuarioSubject.asObservable();

constructor(private httpClient: HttpClient) {
  const userStr = localStorage.getItem('user');

  if (userStr) {
    try {
      this.usuarioSubject.next(JSON.parse(userStr));
    } catch (error) {
      console.warn('Error parseando user, se eliminará:', userStr);
      localStorage.removeItem('user');
      this.usuarioSubject.next(null);
    }
  }
}

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

public setUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
  this.usuarioSubject.next(user);
}
public getUser(): any | null {
  const userStr = localStorage.getItem('user');

  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.warn('Error parseando user en getUser');
      localStorage.removeItem('user');
      return null;
    }
  }

  return null;
}
  public actualizarUsuario(usuario: any): void {
    this.setUser(usuario);
  }

  // -----------------------------------
  // Logout
  // -----------------------------------
  public logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.usuarioSubject.next(null); // Notifica que no hay usuario
  }

  // -----------------------------------
  // Token
  // -----------------------------------
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

public getUserRole(): any {
  const usuarioLocalStorage = localStorage.getItem('user');

  if (usuarioLocalStorage) {
    try {
      const res = JSON.parse(usuarioLocalStorage);
      return res?.data?.rolId || null;
    } catch (error) {
      console.warn('Error parseando usuario para rol');
      localStorage.removeItem('user');
      return null;
    }
  } else {
    console.warn("No se encontró el usuario en el storage");
    return null;
  }
}
  public getUserRoleId(): number | null {
    const user = this.getUser();
    return user?.rol?.id || null;
  }

  // -----------------------------------
  // Llamadas al backend
  // -----------------------------------
  public getCurrentUser(): Observable<any> {
    // ✅ El interceptor le pondrá el token automáticamente en el viaje
    return this.httpClient.get(`${baseUrl}/usuarios/usuario-actual`);
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
