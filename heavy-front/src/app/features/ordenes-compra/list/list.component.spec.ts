import { ordenCompraColorTooltip, ordenCompraEstadoSeverity, ordenCompraRecepcionTooltip } from './list.component';
import { OrdenCompra } from '../../../core/models/orden-compra.model';

describe('Listado de órdenes de compra - presentación de estados', () => {
    it('mapea severities de PrimeNG para los nuevos estados', () => {
        expect(ordenCompraEstadoSeverity('Generada')).toBe('warn');
        expect(ordenCompraEstadoSeverity('Enviada')).toBe('info');
        expect(ordenCompraEstadoSeverity('Confirmada')).toBe('success');
        expect(ordenCompraEstadoSeverity('Pagada')).toBe('success');
        expect(ordenCompraEstadoSeverity('Despachada')).toBe('info');
        expect(ordenCompraEstadoSeverity('Recibida parcialmente')).toBe('warn');
        expect(ordenCompraEstadoSeverity('Cancelada')).toBe('danger');
    });

    it('mapea colores del semáforo a etiquetas legibles', () => {
        expect(ordenCompraColorTooltip('#FFFF00')).toBe('Generada');
        expect(ordenCompraColorTooltip('#2196F3')).toBe('Enviada');
        expect(ordenCompraColorTooltip('#8BC34A')).toBe('Confirmada');
        expect(ordenCompraColorTooltip('#9C27B0')).toBe('Pagada');
        expect(ordenCompraColorTooltip('#E91E63')).toBe('Despachada');
        expect(ordenCompraColorTooltip('#FF9800')).toBe('Recibida parcialmente');
    });

    describe('ordenCompraRecepcionTooltip', () => {
        it('indica que aún no ha sido despachada cuando estado_recepcion es null', () => {
            const orden = { estado_recepcion: null, detalles: [] } as unknown as OrdenCompra;

            expect(ordenCompraRecepcionTooltip(orden)).toBe('Aún no despachada');
        });

        it('suma las cantidades acumuladas de los detalles', () => {
            const orden = {
                estado_recepcion: 'Recibida parcialmente',
                detalles: [
                    { cantidad: 10, cantidad_recibida: 4 },
                    { cantidad: 5, cantidad_recibida: 5 }
                ]
            } as unknown as OrdenCompra;

            expect(ordenCompraRecepcionTooltip(orden)).toBe('9/15 unidades recibidas');
        });
    });
});
