import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import baseUrl from '../../shared/components/helper'; // Manteniendo tu helper
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class PrestamosService {

    private url = `${baseUrl}/prestamos`;

    constructor(private httpClient: HttpClient) { }

    public getPrestamos(): Observable<any[]> {
        return this.httpClient.get<any[]>(this.url);
    }

    public getPrestamoById(id: number): Observable<any> {
        return this.httpClient.get<any>(`${this.url}/${id}`);
    }

    public addPrestamo(prestamo: any): Observable<any> {
        return this.httpClient.post<any>(this.url, prestamo);
    }

    public updatePrestamo(id: number, prestamo: any): Observable<any> {
        return this.httpClient.put<any>(`${this.url}/${id}`, prestamo);
    }

    public deletePrestamo(id: number): Observable<any> {
        return this.httpClient.delete<any>(`${this.url}/${id}`);
    }

    public getPrestamosActivos(): Observable<any[]> {
        return this.httpClient.get<any[]>(`${this.url}/activos`);
    }
}