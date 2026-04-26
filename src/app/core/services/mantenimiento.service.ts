import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MantenimientoService {

    constructor(private httpClient: HttpClient) { }

    public getMantenimientos(): Observable<any[]> {
        return this.httpClient.get<any[]>(`${baseUrl}/Mantenimientos`);
    }

    public getMantenimientoById(id: number) {
        return this.httpClient.get(`${baseUrl}/Mantenimientos/${id}`);
    }

    public addMantenimiento(mantenimiento: any) {
        return this.httpClient.post(`${baseUrl}/Mantenimientos`, mantenimiento);
    }

    public updateEstadoMantenimiento(id: number, mantenimientoDto: any) {
        return this.httpClient.patch(`${baseUrl}/Mantenimientos/${id}`, mantenimientoDto, { responseType: 'text' });
    }

    public deleteMantenimiento(id: number) {
        return this.httpClient.delete(`${baseUrl}/Mantenimientos/${id}`, { responseType: 'text' });
    }
}