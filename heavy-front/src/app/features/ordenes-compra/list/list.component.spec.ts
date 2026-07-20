import { ordenCompraColorTooltip, ordenCompraEstadoSeverity } from './list.component';

describe('Listado de órdenes de compra - presentación de estados', () => {
    it('mapea severities de PrimeNG para los nuevos estados', () => {
        expect(ordenCompraEstadoSeverity('Pendiente de envío')).toBe('warn');
        expect(ordenCompraEstadoSeverity('Enviada')).toBe('info');
        expect(ordenCompraEstadoSeverity('Confirmada')).toBe('success');
        expect(ordenCompraEstadoSeverity('Recibida parcialmente')).toBe('warn');
        expect(ordenCompraEstadoSeverity('Cancelada')).toBe('danger');
    });

    it('mapea colores del semáforo a etiquetas legibles', () => {
        expect(ordenCompraColorTooltip('#FFFF00')).toBe('Pendiente de envío');
        expect(ordenCompraColorTooltip('#2196F3')).toBe('Enviada');
        expect(ordenCompraColorTooltip('#8BC34A')).toBe('Confirmada');
        expect(ordenCompraColorTooltip('#FF9800')).toBe('Recibida parcialmente');
        expect(ordenCompraColorTooltip('#4CAF50')).toBe('Cerrada');
    });
});
