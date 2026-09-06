import { proveedorPuedeConfirmarOrden, proveedorPuedeDespacharOrden } from './ordenes-compra-list.component';

describe('Portal proveedor - acciones de órdenes de compra', () => {
    it('permite confirmar órdenes enviadas o pendientes de revisión de stock', () => {
        expect(proveedorPuedeConfirmarOrden('Enviada')).toBe(true);
        expect(proveedorPuedeConfirmarOrden('Pendiente de Revisión de Stock')).toBe(true);
        expect(proveedorPuedeConfirmarOrden('Stock Incompleto')).toBe(false);
        expect(proveedorPuedeConfirmarOrden('Confirmada')).toBe(false);
    });

    it('permite despachar solo órdenes pagadas', () => {
        expect(proveedorPuedeDespacharOrden('Pagada')).toBe(true);
        expect(proveedorPuedeDespacharOrden('Confirmada')).toBe(false);
        expect(proveedorPuedeDespacharOrden('Enviada')).toBe(false);
        expect(proveedorPuedeDespacharOrden('Recibida')).toBe(false);
    });
});
