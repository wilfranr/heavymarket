import { aplicarCantidadRecibida, aplicarCantidadRechazada, aplicarMotivoRechazo, construirPayloadRecepcion, crearLineasModal, estadoItemSeverity, lineasModalValidas, marcarTodoRecibidoLineas, RecepcionModalLinea } from './recepcion-compra-modal.util';
import { OrdenCompra } from '../../../../core/models/orden-compra.model';

function lineaBase(overrides: Partial<RecepcionModalLinea> = {}): RecepcionModalLinea {
    return {
        orden_compra_detalle_id: 1,
        referencia: 'REF-001',
        cantidad_pedida: 10,
        ya_recibida: 4,
        saldo_pendiente: 6,
        estado_item: 'Recibida parcialmente',
        cantidad_recibida: 6,
        cantidad_rechazada: 0,
        motivo_rechazo: null,
        ...overrides
    };
}

describe('recepcion-compra-modal.util', () => {
    describe('crearLineasModal', () => {
        it('mapea los detalles de la orden de compra usando el saldo pendiente como default', () => {
            const ordenCompra = {
                detalles: [{ id: 1, cantidad: 10, cantidad_recibida: 4, saldo_pendiente: 6, estado_item: 'Recibida parcialmente', referencia: { referencia: 'REF-001' } }]
            } as unknown as OrdenCompra;

            const lineas = crearLineasModal(ordenCompra);

            expect(lineas).toHaveLength(1);
            expect(lineas[0].cantidad_recibida).toBe(6);
            expect(lineas[0].saldo_pendiente).toBe(6);
            expect(lineas[0].ya_recibida).toBe(4);
            expect(lineas[0].referencia).toBe('REF-001');
        });

        it('retorna arreglo vacio cuando la orden de compra es null', () => {
            expect(crearLineasModal(null)).toEqual([]);
        });

        it('deriva saldo_pendiente si el backend no lo envia', () => {
            const ordenCompra = {
                detalles: [{ id: 2, cantidad: 8, cantidad_recibida: 3, referencia: null }]
            } as unknown as OrdenCompra;

            const lineas = crearLineasModal(ordenCompra);

            expect(lineas[0].saldo_pendiente).toBe(5);
            expect(lineas[0].cantidad_recibida).toBe(5);
        });
    });

    describe('marcarTodoRecibidoLineas', () => {
        it('restablece cada linea a su saldo pendiente y limpia rechazos', () => {
            const lineas = [lineaBase({ cantidad_recibida: 0, cantidad_rechazada: 2, motivo_rechazo: 'defecto' })];

            const resultado = marcarTodoRecibidoLineas(lineas);

            expect(resultado[0].cantidad_recibida).toBe(6);
            expect(resultado[0].cantidad_rechazada).toBe(0);
            expect(resultado[0].motivo_rechazo).toBeNull();
        });
    });

    describe('aplicarCantidadRecibida', () => {
        it('actualiza la cantidad y recorta la rechazada si excede la nueva recibida', () => {
            const lineas = [lineaBase({ cantidad_recibida: 6, cantidad_rechazada: 5, motivo_rechazo: 'golpe' })];

            const resultado = aplicarCantidadRecibida(lineas, 1, 3);

            expect(resultado[0].cantidad_recibida).toBe(3);
            expect(resultado[0].cantidad_rechazada).toBe(3);
        });

        it('limpia el motivo cuando la rechazada queda en cero', () => {
            const lineas = [lineaBase({ cantidad_recibida: 6, cantidad_rechazada: 0, motivo_rechazo: null })];

            const resultado = aplicarCantidadRecibida(lineas, 1, 0);

            expect(resultado[0].cantidad_rechazada).toBe(0);
            expect(resultado[0].motivo_rechazo).toBeNull();
        });

        it('no modifica lineas de otro id', () => {
            const lineas = [lineaBase({ orden_compra_detalle_id: 99 })];

            const resultado = aplicarCantidadRecibida(lineas, 1, 3);

            expect(resultado[0].cantidad_recibida).toBe(6);
        });
    });

    describe('aplicarCantidadRechazada', () => {
        it('no permite rechazar mas de lo recibido', () => {
            const lineas = [lineaBase({ cantidad_recibida: 4 })];

            const resultado = aplicarCantidadRechazada(lineas, 1, 10);

            expect(resultado[0].cantidad_rechazada).toBe(4);
        });
    });

    describe('aplicarMotivoRechazo', () => {
        it('actualiza el motivo de la linea indicada', () => {
            const lineas = [lineaBase()];

            const resultado = aplicarMotivoRechazo(lineas, 1, 'Llegó golpeada');

            expect(resultado[0].motivo_rechazo).toBe('Llegó golpeada');
        });
    });

    describe('lineasModalValidas', () => {
        it('es false si ninguna linea tiene cantidad positiva', () => {
            expect(lineasModalValidas([lineaBase({ cantidad_recibida: 0 })])).toBe(false);
        });

        it('es false si hay rechazo sin motivo', () => {
            expect(lineasModalValidas([lineaBase({ cantidad_rechazada: 2, motivo_rechazo: null })])).toBe(false);
        });

        it('es true si hay rechazo con motivo', () => {
            expect(lineasModalValidas([lineaBase({ cantidad_recibida: 6, cantidad_rechazada: 2, motivo_rechazo: 'defecto' })])).toBe(true);
        });

        it('es true cuando al menos una linea con cantidad es valida, aunque otras esten en cero', () => {
            const lineas = [lineaBase({ orden_compra_detalle_id: 1, cantidad_recibida: 6 }), lineaBase({ orden_compra_detalle_id: 2, cantidad_recibida: 0, cantidad_rechazada: 0 })];

            expect(lineasModalValidas(lineas)).toBe(true);
        });
    });

    describe('construirPayloadRecepcion', () => {
        it('excluye lineas sin cantidad y calcula cantidad_conforme', () => {
            const lineas = [lineaBase({ orden_compra_detalle_id: 1, cantidad_recibida: 6, cantidad_rechazada: 1, motivo_rechazo: 'golpe' }), lineaBase({ orden_compra_detalle_id: 2, cantidad_recibida: 0 })];

            const payload = construirPayloadRecepcion(lineas, '2026-08-06T10:00:00.000Z', 'REM-1', 'obs');

            expect(payload.detalles).toEqual([{ orden_compra_detalle_id: 1, cantidad_recibida: 6, cantidad_conforme: 5, cantidad_rechazada: 1, motivo_rechazo: 'golpe' }]);
            expect(payload.fecha_recepcion).toBe('2026-08-06T10:00:00.000Z');
            expect(payload.numero_remision).toBe('REM-1');
            expect(payload.observaciones).toBe('obs');
        });
    });

    describe('estadoItemSeverity', () => {
        it('mapea cada estado a su severity', () => {
            expect(estadoItemSeverity('Recibida')).toBe('success');
            expect(estadoItemSeverity('Recibida parcialmente')).toBe('warn');
            expect(estadoItemSeverity('En tránsito')).toBe('info');
        });
    });
});
