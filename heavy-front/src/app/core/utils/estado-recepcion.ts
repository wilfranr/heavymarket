import { EstadoRecepcion } from '../models/orden-compra.model';

export type EstadoRecepcionSeverity = 'info' | 'warn' | 'success';

/**
 * Mapeo único enum -> severity para el badge de estado_recepcion, usado tanto
 * en el listado como en el detalle de Orden de Compra (evita duplicar lógica).
 */
export function estadoRecepcionSeverity(estado: EstadoRecepcion | null): EstadoRecepcionSeverity {
    switch (estado) {
        case 'Recibida':
            return 'success';
        case 'Recibida parcialmente':
            return 'warn';
        default:
            return 'info';
    }
}

export function estadoRecepcionLabel(estado: EstadoRecepcion | null): string {
    return estado ?? 'Sin recepción';
}
