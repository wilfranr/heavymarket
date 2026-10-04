import { describe, it, expect } from 'vitest';
import { mapReferenciaMasivaRowData } from './create';

describe('mapReferenciaMasivaRowData (bulk import de referencias en Pedido Asesor)', () => {
    it('conserva el codigo digitado como definicion aunque coincida con un articulo existente (regresion #175)', () => {
        const data = mapReferenciaMasivaRowData(10, 2, 'ABC-123', {
            marca_id: 5,
            lista_id: 7,
            articulo_id: 99,
            articulo: {
                definicion: 'Rodamiento de bolas 6205',
                sistema_id: 3
            }
        });

        expect(data.definicion).toBe('ABC-123');
        expect(data.referencia_id).toBe(10);
        expect(data.cantidad).toBe(2);
        expect(data.marca_id).toBe(5);
        expect(data.lista_id).toBe(7);
        expect(data.articulo_id).toBe(99);
        expect(data.sistema_id).toBe(3);
        expect(data.referencias).toEqual([{ label: 'ABC-123', value: 10 }]);
    });

    it('usa el codigo como definicion inicial cuando no hay referenciaData (referencia temporal)', () => {
        const data = mapReferenciaMasivaRowData(null, 1, 'XYZ-999');

        expect(data).toEqual({
            referencia_id: null,
            cantidad: 1,
            definicion: 'XYZ-999'
        });
    });

    it('no agrega sistema_id si el articulo no lo trae', () => {
        const data = mapReferenciaMasivaRowData(1, 1, 'COD-1', { articulo_id: 2, articulo: {} });

        expect(data.sistema_id).toBeUndefined();
        expect(data.definicion).toBe('COD-1');
    });
});
