import { ordenCompraPuedeCancelar, ordenCompraPuedeRecibir, ordenCompraPuedeTransitar } from './detail.component';

describe('Detalle de orden de compra - reglas de estado', () => {
    it('permite las transiciones principales del ciclo de vida', () => {
        expect(ordenCompraPuedeTransitar('Pendiente de envío', 'Enviada')).toBe(true);
        expect(ordenCompraPuedeTransitar('Enviada', 'Confirmada')).toBe(true);
        expect(ordenCompraPuedeTransitar('Confirmada', 'Recibida')).toBe(true);
        expect(ordenCompraPuedeTransitar('Recibida', 'Cerrada')).toBe(true);
    });

    it('bloquea transiciones inválidas y estados terminales', () => {
        expect(ordenCompraPuedeTransitar('Recibida parcialmente', 'Cancelada')).toBe(false);
        expect(ordenCompraPuedeTransitar('Cerrada', 'Enviada')).toBe(false);
        expect(ordenCompraPuedeTransitar('Cancelada', 'Enviada')).toBe(false);
    });

    it('no permite recepción directa desde la orden de compra', () => {
        expect(ordenCompraPuedeRecibir('Confirmada')).toBe(false);
        expect(ordenCompraPuedeRecibir('Recibida parcialmente')).toBe(false);
        expect(ordenCompraPuedeRecibir('Enviada')).toBe(false);
    });

    it('permite cancelar solo estados no terminales sin recepción parcial', () => {
        expect(ordenCompraPuedeCancelar('Enviada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Confirmada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Recibida parcialmente')).toBe(false);
        expect(ordenCompraPuedeCancelar('Cerrada')).toBe(false);
    });
});
