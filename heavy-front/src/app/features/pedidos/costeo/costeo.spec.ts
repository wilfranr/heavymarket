import { ENTREGA_OPTIONS, entregaPayload, entregaValueDesdePersistencia, formatearEntrega } from '../../../core/utils/entrega-plazo';
import { agregarProveedoresAsignadosFaltantes, observacionesCotizacionPayload } from './costeo';

describe('Opciones de entrega de costeo', () => {
    it('expone las nueve opciones en el orden comercial requerido', () => {
        expect(ENTREGA_OPTIONS.map(({ label }) => label)).toEqual([
            'Inmediata',
            '1 día hábil',
            '2 a 3 días hábiles',
            '4 a 7 días hábiles',
            '8 a 15 días hábiles',
            '15 a 30 días hábiles',
            '45 días hábiles',
            '60 días hábiles',
            'Backorder'
        ]);
    });

    it('serializa Backorder sin convertirlo en entrega inmediata', () => {
        expect(entregaPayload('backorder')).toEqual({
            dias_entrega: null,
            es_backorder: true
        });
    });

    it('serializa los rangos mediante su límite superior', () => {
        expect(ENTREGA_OPTIONS.slice(0, 8).map(({ value }) => entregaPayload(value).dias_entrega)).toEqual([0, 1, 3, 7, 15, 30, 45, 60]);
    });

    it('normaliza valores históricos al nuevo rango correspondiente', () => {
        expect(entregaValueDesdePersistencia(5, false)).toBe('7');
        expect(entregaValueDesdePersistencia(null, true)).toBe('backorder');
    });

    it('formatea rangos y Backorder para las vistas de cotización', () => {
        expect(formatearEntrega(15, false)).toBe('8 a 15 días hábiles');
        expect(formatearEntrega(null, true)).toBe('Backorder');
    });

    it('normaliza observaciones de cotización antes de enviarlas al backend', () => {
        expect(observacionesCotizacionPayload('  Observación comercial  ')).toBe('Observación comercial');
        expect(observacionesCotizacionPayload('   ')).toBeUndefined();
    });
});

describe('agregarProveedoresAsignadosFaltantes (fix #178)', () => {
    const proveedoresCompletos = [
        { id: 1, nombre: 'Proveedor A' },
        { id: 2, nombre: 'Proveedor B' },
        { id: 3, nombre: 'Proveedor C (fuera de categoría)' }
    ];

    it('no modifica la lista si el proveedor asignado ya está en las opciones filtradas', () => {
        const opciones = [{ label: 'Proveedor A', value: 1 }];

        expect(agregarProveedoresAsignadosFaltantes(opciones, proveedoresCompletos, [1])).toEqual(opciones);
    });

    it('agrega el proveedor ya asignado aunque no cumpla el filtro de marca/categoría de esa fila', () => {
        const opciones = [{ label: 'Proveedor A', value: 1 }];

        const resultado = agregarProveedoresAsignadosFaltantes(opciones, proveedoresCompletos, [1, 3]);

        expect(resultado).toEqual([
            { label: 'Proveedor A', value: 1 },
            { label: 'Proveedor C (fuera de categoría)', value: 3 }
        ]);
    });

    it('ignora ids nulos, indefinidos o sin coincidencia en el catálogo completo', () => {
        const opciones: { label: string; value: number }[] = [];

        expect(agregarProveedoresAsignadosFaltantes(opciones, proveedoresCompletos, [null, undefined, 999])).toEqual([]);
    });
});
