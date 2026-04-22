import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MantenimientoService {

    constructor(private httpClient: HttpClient) { }

    /**
     * Obtiene todos los registros de mantenimiento
     */
    public getMantenimientos(): Observable<any[]> {
        return this.httpClient.get<any[]>(`${baseUrl}/mantenimientos`);
    }

    /**
     * Registra un nuevo mantenimiento (Programar)
     */
    public addMantenimiento(mantenimiento: any): Observable<any> {
        return this.httpClient.post(`${baseUrl}/mantenimientos`, mantenimiento);
    }

    /**
     * Obtiene un mantenimiento por su ID
     */
    public getMantenimientoById(id: number): Observable<any> {
        return this.httpClient.get(`${baseUrl}/mantenimientos/${id}`);
    }

    /**
     * Actualiza los datos de un mantenimiento existente
     */
    public updateMantenimiento(id: number, mantenimiento: any): Observable<any> {
        return this.httpClient.put(`${baseUrl}/mantenimientos/${id}`, mantenimiento);
    }

    /**
     * Cambia el estado a COMPLETADO
     * Si tu backend usa un endpoint específico para esto
     */
    public completarMantenimiento(id: number): Observable<any> {
        return this.httpClient.patch(`${baseUrl}/mantenimientos/${id}/completar`, {});
    }

    /**
     * Elimina un registro de mantenimiento
     */
    public deleteMantenimiento(id: number): Observable<any> {
        return this.httpClient.delete(`${baseUrl}/mantenimientos/${id}`);
    }

    /**
     * Opcional: Obtener mantenimientos por artículo específico
     */
    public getMantenimientosByArticulo(articuloId: number): Observable<any[]> {
        return this.httpClient.get<any[]>(`${baseUrl}/mantenimientos/articulo/${articuloId}`);
    }
}