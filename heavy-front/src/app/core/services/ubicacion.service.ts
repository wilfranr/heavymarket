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
