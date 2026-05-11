import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../auth/models/user.model';

export interface PaginatedUsers {
    data: User[];
    meta: {
        current_page: number;
        total: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/users`;

    getUsers(page: number = 1, search: string = ''): Observable<PaginatedUsers> {
        let params = new HttpParams().set('page', page.toString());
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<PaginatedUsers>(this.apiUrl, { params });
    }

    getUser(id: number): Observable<{ data: User }> {
        return this.http.get<{ data: User }>(`${this.apiUrl}/${id}`);
    }

    createUser(user: Partial<User> & { password?: string; roles?: string[] }): Observable<{ data: User }> {
        return this.http.post<{ data: User }>(this.apiUrl, user);
    }

    updateUser(id: number, user: Partial<User> & { password?: string; roles?: string[] }): Observable<{ data: User }> {
        return this.http.put<{ data: User }>(`${this.apiUrl}/${id}`, user);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
