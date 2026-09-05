/**
 * Lógica compartida de validación de líneas de recepción de compra,
 * usada por el modal de recepción desde Orden de Trabajo y desde Orden de Compra.
 */
export interface RecepcionLineaForm {
    orden_compra_detalle_id: number;
    referencia: string;
    /** Tope de esta operacion (saldo pendiente por recibir), no el total original ordenado. */
    cantidad_ordenada: number;
    /** Informativo: cuanto ya se recibio en recepciones previas de esta linea. */
    cantidad_ya_recibida?: number;
    cantidad_recibida: number;
    cantidad_conforme: number;
    cantidad_rechazada: number;
    motivo_rechazo: string | null;
}

export function recepcionCompraLineaValida(linea: RecepcionLineaForm): boolean {
    const sumaCondiciones = linea.cantidad_conforme + linea.cantidad_rechazada;
    const motivoValido = linea.cantidad_rechazada <= 0 || (linea.motivo_rechazo ?? '').trim().length > 0;

    return linea.cantidad_recibida > 0 && linea.cantidad_recibida === sumaCondiciones && linea.cantidad_recibida <= linea.cantidad_ordenada && motivoValido;
}
