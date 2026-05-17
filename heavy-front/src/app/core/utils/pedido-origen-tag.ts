import { PedidoOrigen } from '../models/pedido.model';

export const PEDIDO_ORIGEN_ETIQUETA: Record<PedidoOrigen, string> = {
    panel: 'Panel',
    landing: 'Landing'
};

export const PEDIDO_ORIGEN_TAG_CLASS: Record<PedidoOrigen, string> = {
    panel: '!bg-slate-500/15 !text-slate-600 dark:!text-slate-300 border border-slate-500/30',
    landing: '!bg-sky-500/15 !text-sky-700 dark:!text-sky-300 border border-sky-500/30'
};

export function pedidoOrigenEtiqueta(origen: string | null | undefined): string {
    if (origen && origen in PEDIDO_ORIGEN_ETIQUETA) {
        return PEDIDO_ORIGEN_ETIQUETA[origen as PedidoOrigen];
    }
    return PEDIDO_ORIGEN_ETIQUETA.panel;
}

export function pedidoOrigenTagClass(origen: string | null | undefined): string {
    if (origen && origen in PEDIDO_ORIGEN_TAG_CLASS) {
        return PEDIDO_ORIGEN_TAG_CLASS[origen as PedidoOrigen];
    }
    return PEDIDO_ORIGEN_TAG_CLASS.panel;
}
