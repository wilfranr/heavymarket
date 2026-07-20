import { recepcionCompraLineaValida } from './detail.component';

describe('Detalle de orden de trabajo - recepción de compra', () => {
    it('valida que recibida sea igual a conforme más rechazada', () => {
        expect(
            recepcionCompraLineaValida({
                orden_compra_detalle_id: 1,
                referencia: 'ALT-001',
                cantidad_ordenada: 10,
                cantidad_recibida: 6,
                cantidad_conforme: 5,
                cantidad_rechazada: 1,
                motivo_rechazo: 'Golpeado'
            })
        ).toBe(true);

        expect(
            recepcionCompraLineaValida({
                orden_compra_detalle_id: 1,
                referencia: 'ALT-001',
                cantidad_ordenada: 10,
                cantidad_recibida: 6,
                cantidad_conforme: 6,
                cantidad_rechazada: 1,
                motivo_rechazo: 'Golpeado'
            })
        ).toBe(false);
    });

    it('exige motivo cuando hay cantidad rechazada', () => {
        expect(
            recepcionCompraLineaValida({
                orden_compra_detalle_id: 1,
                referencia: 'ALT-001',
                cantidad_ordenada: 10,
                cantidad_recibida: 1,
                cantidad_conforme: 0,
                cantidad_rechazada: 1,
                motivo_rechazo: null
            })
        ).toBe(false);
    });
});
