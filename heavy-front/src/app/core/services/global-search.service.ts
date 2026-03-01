import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SearchResult {
    id: number;
    title: string;
    description: string;
    type: string;
    route: string;
}

export interface SearchResponse {
    data: SearchResult[];
}

@Injectable({
    providedIn: 'root'
})
export class GlobalSearchService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = environment.apiUrl + '/search';

    search(query: string): Observable<SearchResponse> {
        let params = new HttpParams().set('q', query);
        return this.http.get<SearchResponse>(this.apiUrl, { params });
    }
}
