import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrasladosService {

  private url = `${baseUrl}/traslados`;

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

  public uploadPDF(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.url}/upload-pdf`, formData);
  }

  public firmarTraslado(id: number, firmante: string): Observable<any> {
    const params = new HttpParams().set('firmante', firmante);
    return this.http.put<any>(`${this.url}/${id}/firmar`, {}, { params });
  }
}
