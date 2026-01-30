export interface Country {
    id: number;
    name: string;
    iso2: string;
    phonecode: string;
}

export interface State {
    id: number;
    name: string;
    country_id: number;
}

export interface City {
    id: number;
    name: string;
    state_id: number;
    country_id: number;
}
