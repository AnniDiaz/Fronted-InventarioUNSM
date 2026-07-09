import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: any | null;
}

export interface NotificacionDto {
  id: number;
  tipo: 'VidaUtilProxima' | 'PrestamoPendiente';
  titulo: string;
  mensaje: string;
  articuloId: number | null;
  prestamoId: number | null;
  fechaCreacion: string;
  leido: boolean;
  fechaLectura: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {

  private url = `${baseUrl}/notificaciones`;

  constructor(private httpClient: HttpClient) { }

  public getNotificaciones(soloNoLeidas?: boolean): Observable<ApiResponse<NotificacionDto[]>> {
    let params = new HttpParams();
    if (soloNoLeidas !== undefined) {
      params = params.set('soloNoLeidas', soloNoLeidas);
    }
    return this.httpClient.get<ApiResponse<NotificacionDto[]>>(this.url, { params });
  }

  public getCountNoLeidas(): Observable<ApiResponse<number>> {
    return this.httpClient.get<ApiResponse<number>>(`${this.url}/no-leidas/count`);
  }

  public marcarLeida(id: number): Observable<ApiResponse<NotificacionDto>> {
    return this.httpClient.put<ApiResponse<NotificacionDto>>(`${this.url}/${id}/marcar-leida`, {});
  }

  public marcarTodasLeidas(): Observable<ApiResponse<object>> {
    return this.httpClient.put<ApiResponse<object>>(`${this.url}/marcar-todas-leidas`, {});
  }
}
