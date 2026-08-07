import { ordenCompraPuedeCancelar, ordenCompraPuedeRecibir, ordenCompraPuedeTransitar, ordenCompraProgresoItem } from './detail.component';
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

    it('permite recepción directa desde la orden de compra en estados despachables', () => {
        expect(ordenCompraPuedeRecibir('Enviada')).toBe(true);
        expect(ordenCompraPuedeRecibir('Confirmada')).toBe(true);
        expect(ordenCompraPuedeRecibir('Despachada')).toBe(true);
        expect(ordenCompraPuedeRecibir('Recibida parcialmente')).toBe(true);
    });

    it('no permite recepción directa fuera del rango recepcionable', () => {
        expect(ordenCompraPuedeRecibir('Generada')).toBe(false);
        expect(ordenCompraPuedeRecibir('Pagada')).toBe(false);
        expect(ordenCompraPuedeRecibir('Recibida')).toBe(false);
        expect(ordenCompraPuedeRecibir('Cancelada')).toBe(false);
        expect(ordenCompraPuedeRecibir(null)).toBe(false);
    });

    it('permite cancelar solo estados no terminales sin recepción parcial', () => {
        expect(ordenCompraPuedeCancelar('Generada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Enviada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Confirmada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Pagada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Despachada')).toBe(true);
        expect(ordenCompraPuedeCancelar('Recibida parcialmente')).toBe(false);
    });

    it('calcula el progreso de recepción de un ítem como porcentaje', () => {
        expect(ordenCompraProgresoItem({ cantidad: 10, cantidad_recibida: 4 })).toBe(40);
        expect(ordenCompraProgresoItem({ cantidad: 10, cantidad_recibida: 10 })).toBe(100);
        expect(ordenCompraProgresoItem({ cantidad: 10, cantidad_recibida: 0 })).toBe(0);
        expect(ordenCompraProgresoItem({ cantidad: 0, cantidad_recibida: 0 })).toBe(0);
        expect(ordenCompraProgresoItem({ cantidad: 10, cantidad_recibida: 15 })).toBe(100);
    });
});
