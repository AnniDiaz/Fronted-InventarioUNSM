import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';

@Injectable({
  providedIn: 'root'
})
export class ClasificacionDepreciacionService {

  constructor(private http: HttpClient) { }

  public getClasificaciones() {
    return this.http.get<any[]>(`${baseUrl}/clasificacion-depreciacion`);
  }

  public getClasificacionById(id: number) {
    return this.http.get<any>(`${baseUrl}/clasificacion-depreciacion/${id}`);
  }

  public addClasificacion(clasificacion: any) {
    return this.http.post(`${baseUrl}/clasificacion-depreciacion`, clasificacion);
  }

  public updateClasificacion(id: number, clasificacion: any) {
    return this.http.put(`${baseUrl}/clasificacion-depreciacion/${id}`, clasificacion);
  }

  public deleteClasificacion(id: number) {
    return this.http.delete(`${baseUrl}/clasificacion-depreciacion/${id}`);
  }
}
