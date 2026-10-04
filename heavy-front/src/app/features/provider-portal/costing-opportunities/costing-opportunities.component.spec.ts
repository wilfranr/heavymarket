import { calcularFletesSeleccion } from './costing-opportunities.component';

describe('calcularFletesSeleccion', () => {
    it('devuelve 0 para proveedores nacionales, sin importar el peso o la tarifa', () => {
        const filas = [{ peso: 10, form_cantidad_cotizada: 2 }];

        expect(calcularFletesSeleccion(filas, { is_national: true, flete: 5 })).toBe(0);
    });

    it('calcula el flete internacional como peso_kg * 2.20462 * cantidad * tarifa, sumando todas las filas seleccionadas', () => {
        const filas = [
            { peso: 10, form_cantidad_cotizada: 2 },
            { peso: 5, form_cantidad_cotizada: 1 }
        ];

        const esperado = 10 * 2.20462 * 2 * 3 + 5 * 2.20462 * 1 * 3;

        expect(calcularFletesSeleccion(filas, { is_national: false, flete: 3 })).toBeCloseTo(esperado, 5);
    });

    it('trata peso o cantidad ausentes/invalidos como 0 en vez de lanzar error', () => {
        const filas = [{ peso: undefined, form_cantidad_cotizada: 2 }, { peso: 10, form_cantidad_cotizada: undefined as unknown as number }];

        expect(calcularFletesSeleccion(filas, { is_national: false, flete: 3 })).toBe(0);
    });
});
