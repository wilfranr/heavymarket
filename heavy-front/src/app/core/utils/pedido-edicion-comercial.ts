import { PedidoEstado } from '../models/pedido.model';

/** Estados en los que la edicion comercial (`/edit`, PUT pedido) no esta permitida para ningun rol. */
export const ESTADOS_SIN_EDICION_COMERCIAL: readonly PedidoEstado[] = [
    'Cancelado',
    'En_Costeo',
    'Cotizado',
    'Aprobado',
    'Rechazado',
    'Enviado',
    'Entregado',
];

export function pedidoPermiteEdicionComercial(estado: PedidoEstado | string | undefined | null): boolean {
    if (!estado) {
        return false;
    }
    return !ESTADOS_SIN_EDICION_COMERCIAL.includes(estado as PedidoEstado);
}
