import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class TrasladosService {

  constructor(private http: HttpClient) {}

  realizarTraslado(data: any) {
    return this.http.post(`${baseUrl}/traslados/realizar`, data);
  }

  getTraslados() {
    return this.http.get<any[]>(`${baseUrl}/traslados`);
  }

  deleteTraslado(id: number) {
    return this.http.delete(`${baseUrl}/traslados/${id}`);
  }
}
