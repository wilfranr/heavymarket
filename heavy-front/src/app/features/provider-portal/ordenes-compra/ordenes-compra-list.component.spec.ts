import { proveedorPuedeConfirmarOrden, proveedorPuedeDespacharOrden } from './ordenes-compra-list.component';

describe('Portal proveedor - acciones de órdenes de compra', () => {
    it('permite confirmar solo órdenes enviadas', () => {
        expect(proveedorPuedeConfirmarOrden('Enviada')).toBe(true);
        expect(proveedorPuedeConfirmarOrden('Confirmada')).toBe(false);
    });

    it('permite despachar solo órdenes confirmadas', () => {
        expect(proveedorPuedeDespacharOrden('Confirmada')).toBe(true);
        expect(proveedorPuedeDespacharOrden('Enviada')).toBe(false);
        expect(proveedorPuedeDespacharOrden('Recibida')).toBe(false);
    });
});
