import { ordenCompraPuedeCancelar, ordenCompraPuedeRecibir, ordenCompraPuedeTransitar } from './detail.component';
import { OrdenCompraEstado } from '../../../core/models/orden-compra.model';

describe('Detalle de orden de compra - reglas de estado', () => {
    it('permite las transiciones principales del ciclo de vida', () => {
        expect(ordenCompraPuedeTransitar('Generada', 'Enviada')).toBe(true);
        expect(ordenCompraPuedeTransitar('Enviada', 'Confirmada')).toBe(true);
        expect(ordenCompraPuedeTransitar('Confirmada', 'Pagada')).toBe(true);
        expect(ordenCompraPuedeTransitar('Pagada', 'Despachada')).toBe(true);
        expect(ordenCompraPuedeTransitar('Despachada', 'Recibida')).toBe(true);
    });

    it('bloquea transiciones inválidas y estados terminales', () => {
        expect(ordenCompraPuedeTransitar('Recibida parcialmente', 'Cancelada')).toBe(false);
        expect(ordenCompraPuedeTransitar('Recibida', 'Enviada')).toBe(false);
        expect(ordenCompraPuedeTransitar('Cancelada', 'Enviada')).toBe(false);
    });

    it('no falla con estados legacy previos a la migración de logística', () => {
        expect(ordenCompraPuedeTransitar('Pendiente de envío' as OrdenCompraEstado, 'Enviada')).toBe(false);
        expect(ordenCompraPuedeTransitar('Cerrada' as OrdenCompraEstado, 'Recibida')).toBe(false);
    });

    it('no permite recepción directa desde la orden de compra', () => {
        expect(ordenCompraPuedeRecibir('Confirmada')).toBe(false);
        expect(ordenCompraPuedeRecibir('Recibida parcialmente')).toBe(false);
        expect(ordenCompraPuedeRecibir('Enviada')).toBe(false);
    });

    it('permite cancelar solo estados no terminales sin recepción parcial', () => {
        expect(ordenCompraPuedeCancelar('Generada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Enviada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Confirmada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Pagada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Despachada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Recibida parcialmente')).toBe(false);
    });
});
