import { PedidoEstado } from '../models/pedido.model';

/** Estados en los que la edición comercial (`/edit`, PUT pedido) no está permitida para ningún rol. */
export const ESTADOS_SIN_EDICION_COMERCIAL: readonly PedidoEstado[] = ['Cancelado', 'En_Costeo'];

export function pedidoPermiteEdicionComercial(estado: PedidoEstado | string | undefined | null): boolean {
    if (!estado) {
        return false;
    }
    return !ESTADOS_SIN_EDICION_COMERCIAL.includes(estado as PedidoEstado);
}
