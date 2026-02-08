import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ClientAuthService {
    private apiUrl = `${environment.apiUrl}/landing/auth`;

    constructor(private http: HttpClient) { }

    register(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, data);
    }

    login(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, data);
    }

    getSocialRedirectUrl(provider: string): Observable<any> {
        return this.http.get<{ url: string }>(`${this.apiUrl}/${provider}/redirect`);
    }

    me(): Observable<any> {
        const token = localStorage.getItem('clientToken');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        return this.http.get<any>(`${environment.apiUrl}/me`, { headers }).pipe(
            map(res => res.data)
        );
    }
}
