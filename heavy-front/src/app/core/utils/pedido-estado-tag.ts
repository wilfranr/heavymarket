import { PedidoEstado } from '../models/pedido.model';

/**
 * Textos homologados para mostrar en UI. Los valores canónicos (`En_Costeo`, `En_Analisis`, …)
 * se mantienen en API y base de datos; aquí solo la presentación.
 */
export const PEDIDO_ESTADO_ETIQUETA: Record<PedidoEstado, string> = {
    Borrador: 'Borrador',
    Nuevo: 'Nuevo',
    En_Analisis: 'Análisis',
    Enviado: 'Enviado',
    En_Costeo: 'Costeo',
    Cotizado: 'Cotizado',
    Aprobado: 'Aprobado',
    Entregado: 'Entregado',
    Rechazado: 'Rechazado',
    Cancelado: 'Cancelado'
};

export function pedidoEstadoEtiqueta(estado: string | null | undefined): string {
    if (estado && estado in PEDIDO_ESTADO_ETIQUETA) {
        return PEDIDO_ESTADO_ETIQUETA[estado as PedidoEstado];
    }
    return estado || PEDIDO_ESTADO_ETIQUETA.Nuevo;
}

/**
 * Estilos de etiqueta por estado: un tono distinto por cada valor de {@link PedidoEstado}.
 * Usado en lista, detalle, edición y widgets para evitar repetir colores entre estados.
 */
/** `!` fuerza fondo/texto por encima de `.p-tag { background, color }` del tema PrimeNG. */
export const PEDIDO_ESTADO_TAG_CLASS: Record<PedidoEstado, string> = {
    Borrador: '!bg-amber-500/15 !text-amber-600 dark:!text-amber-300 border border-amber-500/30',
    Nuevo: '!bg-emerald-500/15 !text-emerald-600 dark:!text-emerald-300 border border-emerald-500/30',
    En_Analisis: '!bg-blue-500/15 !text-blue-600 dark:!text-blue-300 border border-blue-500/30',
    Enviado: '!bg-cyan-500/15 !text-cyan-600 dark:!text-cyan-300 border border-cyan-500/30',
    En_Costeo: '!bg-orange-500/15 !text-orange-600 dark:!text-orange-300 border border-orange-500/30',
    Cotizado: '!bg-purple-500/15 !text-purple-600 dark:!text-purple-300 border border-purple-500/30',
    Aprobado: '!bg-green-500/15 !text-green-600 dark:!text-green-300 border border-green-500/30',
    Entregado: '!bg-teal-500/15 !text-teal-600 dark:!text-teal-300 border border-teal-500/30',
    Rechazado: '!bg-red-500/15 !text-red-600 dark:!text-red-300 border border-red-500/30',
    Cancelado: '!bg-slate-500/15 !text-slate-600 dark:!text-slate-300 border border-slate-500/30'
};

export function pedidoEstadoTagClass(estado: string | null | undefined): string {
    if (estado && estado in PEDIDO_ESTADO_TAG_CLASS) {
        return PEDIDO_ESTADO_TAG_CLASS[estado as PedidoEstado];
    }
    return PEDIDO_ESTADO_TAG_CLASS.Nuevo;
}
