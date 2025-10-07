  import { HttpClient } from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import baseUrl from '../../shared/components/helper';
  import { map, Observable, switchMap } from 'rxjs';

  @Injectable({
    providedIn: 'root'
  })
  export class AuthService {

    constructor(private http: HttpClient) {}

    registrar(usuario: any): Observable<any> {
      return this.http.post<any>(`${baseUrl}/usuarios/`, usuario);
    }

    generarToken(username: string, password: string): Observable<any> {
      return this.http.post<any>(`${baseUrl}/Usuarios/login`, {
        username,
        password
      });
    }

    registrarConToken(usuario: any): Observable<string> {
      return this.registrar(usuario).pipe(
        switchMap(() =>
          this.generarToken(usuario.username, usuario.password).pipe(
            map((resp: any) => resp.token)
          )
        )
      );
    }
  }
