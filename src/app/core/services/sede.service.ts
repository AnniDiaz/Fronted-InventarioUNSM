import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class SedeService {

  constructor(private httpClient: HttpClient) { }

  public getSedes() {
    return this.httpClient.get<any[]>(`${baseUrl}/Sedes`);
  }

  public getSedeById(id: number) {
    return this.httpClient.get(`${baseUrl}/Sedes/${id}`);
  }

  public addSede(sede: any) {
    return this.httpClient.post(`${baseUrl}/Sedes`, sede);
  }

  public updateSede(id: number, sede: any) {
    return this.httpClient.put(`${baseUrl}/Sedes/${id}`, sede);
  }

  public deleteSede(id: number) {
    return this.httpClient.delete(`${baseUrl}/Sedes/${id}`);
  }

}
