import { EstadoRecepcion, OrdenCompra } from '../../../../core/models/orden-compra.model';
import { RegistrarRecepcionPayload } from '../../../../core/models/recepcion-compra.model';
import { recepcionCompraLineaValida } from '../../../../core/utils/recepcion-lines.util';
import { estadoRecepcionSeverity } from '../../../../core/utils/estado-recepcion';

export interface RecepcionModalLinea {
    orden_compra_detalle_id: number;
    referencia: string;
    cantidad_pedida: number;
    ya_recibida: number;
    saldo_pendiente: number;
    estado_item: EstadoRecepcion | null;
    cantidad_recibida: number;
    cantidad_rechazada: number;
    motivo_rechazo: string | null;
}

type OrdenCompraDetalle = NonNullable<OrdenCompra['detalles']>[number];

export function crearLineaModal(detalle: OrdenCompraDetalle): RecepcionModalLinea {
    const saldoPendiente = detalle.saldo_pendiente ?? Math.max(detalle.cantidad - (detalle.cantidad_recibida ?? 0), 0);

    return {
        orden_compra_detalle_id: detalle.id,
        referencia: detalle.referencia?.referencia || detalle.referencia?.codigo_heavymarket || `Detalle #${detalle.id}`,
        cantidad_pedida: detalle.cantidad,
        ya_recibida: detalle.cantidad_recibida ?? 0,
        saldo_pendiente: saldoPendiente,
        estado_item: detalle.estado_item ?? null,
        cantidad_recibida: saldoPendiente,
        cantidad_rechazada: 0,
        motivo_rechazo: null
    };
}

export function crearLineasModal(ordenCompra: OrdenCompra | null): RecepcionModalLinea[] {
    return (ordenCompra?.detalles ?? ordenCompra?.referencias ?? []).map((detalle) => crearLineaModal(detalle));
}

export function marcarTodoRecibidoLineas(lineas: RecepcionModalLinea[]): RecepcionModalLinea[] {
    return lineas.map((linea) => ({
        ...linea,
        cantidad_recibida: linea.saldo_pendiente,
        cantidad_rechazada: 0,
        motivo_rechazo: null
    }));
}

export function aplicarCantidadRecibida(lineas: RecepcionModalLinea[], id: number, valor: number | null): RecepcionModalLinea[] {
    return lineas.map((linea) => {
        if (linea.orden_compra_detalle_id !== id) return linea;
        const cantidadRecibida = Number(valor ?? 0);
        const cantidadRechazada = Math.min(linea.cantidad_rechazada, cantidadRecibida);

        return {
            ...linea,
            cantidad_recibida: cantidadRecibida,
            cantidad_rechazada: cantidadRechazada,
            motivo_rechazo: cantidadRechazada > 0 ? linea.motivo_rechazo : null
        };
    });
}

export function aplicarCantidadRechazada(lineas: RecepcionModalLinea[], id: number, valor: number | null): RecepcionModalLinea[] {
    return lineas.map((linea) => {
        if (linea.orden_compra_detalle_id !== id) return linea;
        const cantidadRechazada = Math.min(Number(valor ?? 0), linea.cantidad_recibida);

        return {
            ...linea,
            cantidad_rechazada: cantidadRechazada,
            motivo_rechazo: cantidadRechazada > 0 ? linea.motivo_rechazo : null
        };
    });
}

export function aplicarMotivoRechazo(lineas: RecepcionModalLinea[], id: number, valor: string | null): RecepcionModalLinea[] {
    return lineas.map((linea) => (linea.orden_compra_detalle_id === id ? { ...linea, motivo_rechazo: valor } : linea));
}

function aLineaCompartida(linea: RecepcionModalLinea) {
    return {
        orden_compra_detalle_id: linea.orden_compra_detalle_id,
        referencia: linea.referencia,
        cantidad_ordenada: linea.saldo_pendiente,
        cantidad_recibida: linea.cantidad_recibida,
        cantidad_conforme: linea.cantidad_recibida - linea.cantidad_rechazada,
        cantidad_rechazada: linea.cantidad_rechazada,
        motivo_rechazo: linea.motivo_rechazo
    };
}

export function lineasModalValidas(lineas: RecepcionModalLinea[]): boolean {
    const lineasConCantidad = lineas.filter((linea) => linea.cantidad_recibida > 0);

    return lineasConCantidad.length > 0 && lineasConCantidad.every((linea) => recepcionCompraLineaValida(aLineaCompartida(linea)));
}

export function construirPayloadRecepcion(lineas: RecepcionModalLinea[], fechaRecepcionIso: string, numeroRemision: string | null, observaciones: string | null): RegistrarRecepcionPayload {
    return {
        fecha_recepcion: fechaRecepcionIso,
        numero_remision: numeroRemision,
        observaciones: observaciones,
        detalles: lineas
            .filter((linea) => linea.cantidad_recibida > 0)
            .map((linea) => ({
                orden_compra_detalle_id: linea.orden_compra_detalle_id,
                cantidad_recibida: linea.cantidad_recibida,
                cantidad_conforme: linea.cantidad_recibida - linea.cantidad_rechazada,
                cantidad_rechazada: linea.cantidad_rechazada,
                motivo_rechazo: linea.motivo_rechazo
            }))
    };
}

export function estadoItemSeverity(estado: EstadoRecepcion): 'success' | 'info' | 'warn' {
    return estadoRecepcionSeverity(estado);
}
