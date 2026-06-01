import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class SolicitantesService {

  constructor(private httpClient: HttpClient) { }

  public getSolicitantes(): Observable<any> {
    return this.httpClient.get<any>(`${baseUrl}/Solicitantes`);
  }

  public getSolicitanteById(id: number): Observable<any> {
    return this.httpClient.get<any>(`${baseUrl}/Solicitantes/${id}`);
  }

  public addSolicitante(solicitante: any): Observable<any> {
    return this.httpClient.post<any>(
      `${baseUrl}/Solicitantes`,
      solicitante
    );
  }

  public updateSolicitante(
    id: number,
    solicitante: any
  ): Observable<any> {
    return this.httpClient.put<any>(
      `${baseUrl}/Solicitantes/${id}`,
      solicitante
    );
  }

  public deleteSolicitante(id: number): Observable<any> {
    return this.httpClient.delete<any>(
      `${baseUrl}/Solicitantes/${id}`
    );
  }
}
