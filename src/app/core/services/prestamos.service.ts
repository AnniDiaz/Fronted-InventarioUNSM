import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PrestamosService {

    constructor(private httpClient: HttpClient) { }

    // Obtener todos los préstamos para la tabla principal
    public getPrestamos(): Observable<any[]> {
        return this.httpClient.get<any[]>(`${baseUrl}/prestamos`);
    }

    public addPrestamo(prestamo: any) {
        return this.httpClient.post(`${baseUrl}/prestamos`, prestamo);
    }

    public getPrestamoById(id: number) {
        return this.httpClient.get(`${baseUrl}/prestamos/${id}`);
    }

    public marcarComoDevuelto(id: number) {
        return this.httpClient.patch(`${baseUrl}/prestamos/${id}/devolver`, {});
    }
    public deletePrestamo(id: number) {
        return this.httpClient.delete(`${baseUrl}/prestamos/${id}`);
    }

    public getPrestamosPorEstado(estado: string): Observable<any[]> {
        return this.httpClient.get<any[]>(`${baseUrl}/prestamos/estado/${estado}`);
    }
}