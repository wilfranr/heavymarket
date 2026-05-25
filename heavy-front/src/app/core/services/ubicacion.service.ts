import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Country, State, City } from '../models/ubicacion.model';

@Injectable({
    providedIn: 'root'
})
export class UbicacionService extends ApiService {
    getCountries(): Observable<{ data: Country[] }> {
        return this.get<{ data: Country[] }>('ubicaciones/paises');
    }

    getCountriesAdmin(params?: { page?: number; per_page?: number; search?: string; region?: string }): Observable<{ data: Country[]; meta: any }> {
        const httpParams: any = {};
        if (params?.page) httpParams.page = params.page;
        if (params?.per_page) httpParams.per_page = params.per_page;
        if (params?.search) httpParams.search = params.search;
        if (params?.region) httpParams.region = params.region;
        return this.get<{ data: Country[]; meta: any }>('countries', httpParams);
    }

    getCountry(id: number): Observable<{ data: Country }> {
        return this.get<{ data: Country }>(`countries/${id}`);
    }

    updateCountry(id: number, data: { flete?: number | null; is_active?: boolean }): Observable<{ message: string; data: Country }> {
        return this.put<{ message: string; data: Country }>(`countries/${id}`, data);
    }

    getStates(countryId?: number): Observable<{ data: State[] }> {
        const params: any = {};
        if (countryId) {
            params.country_id = countryId;
        }
        return this.get<{ data: State[] }>('ubicaciones/departamentos', params);
    }

    getCities(stateId?: number, countryId?: number): Observable<{ data: City[] }> {
        const params: any = {};
        if (stateId) {
            params.state_id = stateId;
        }
        if (countryId) {
            params.country_id = countryId;
        }
        return this.get<{ data: City[] }>('ubicaciones/ciudades', params);
    }
}
