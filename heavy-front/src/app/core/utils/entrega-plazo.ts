export type EntregaValue = '0' | '1' | '3' | '7' | '15' | '30' | '45' | '60' | 'backorder';

export interface EntregaOption {
    label: string;
    value: EntregaValue;
}

export interface EntregaPayload {
    dias_entrega: number | null;
    es_backorder: boolean;
}

export const ENTREGA_OPTIONS: EntregaOption[] = [
    { label: 'Inmediata', value: '0' },
    { label: '1 día hábil', value: '1' },
    { label: '2 a 3 días hábiles', value: '3' },
    { label: '4 a 7 días hábiles', value: '7' },
    { label: '8 a 15 días hábiles', value: '15' },
    { label: '15 a 30 días hábiles', value: '30' },
    { label: '45 días hábiles', value: '45' },
    { label: '60 días hábiles', value: '60' },
    { label: 'Backorder', value: 'backorder' }
];

export function entregaValueDesdePersistencia(diasEntrega: number | null | undefined, esBackorder: boolean | undefined): EntregaValue {
    if (esBackorder) {
        return 'backorder';
    }

    const dias = diasEntrega ?? 0;

    if (dias <= 0) return '0';
    if (dias <= 1) return '1';
    if (dias <= 3) return '3';
    if (dias <= 7) return '7';
    if (dias <= 15) return '15';
    if (dias <= 30) return '30';
    if (dias <= 45) return '45';

    return '60';
}

export function entregaPayload(value: EntregaValue): EntregaPayload {
    if (value === 'backorder') {
        return {
            dias_entrega: null,
            es_backorder: true
        };
    }

    return {
        dias_entrega: Number(value),
        es_backorder: false
    };
}

export function formatearEntrega(diasEntrega: number | null | undefined, esBackorder: boolean | undefined): string {
    if (esBackorder) {
        return 'Backorder';
    }

    if (diasEntrega === null || diasEntrega === undefined) {
        return 'Sin definir';
    }

    const option = ENTREGA_OPTIONS.find(({ value }) => value !== 'backorder' && Number(value) === diasEntrega);

    return option?.label ?? `${diasEntrega} días hábiles`;
}
