import { calcularResumenAprobacionCotizacion, calcularTotalReferenciasCotizacion, cotizacionPermiteRespuesta } from './detail.component';
import { CotizacionReferenciaProveedor } from '../../../core/models/cotizacion.model';

describe('Detalle de cotización', () => {
    it('permite aprobar o rechazar cotizaciones activas del flujo de costeo', () => {
        expect(cotizacionPermiteRespuesta('Enviada')).toBe(true);
        expect(cotizacionPermiteRespuesta('Borrador')).toBe(true);
        expect(cotizacionPermiteRespuesta('En_Proceso')).toBe(true);
        expect(cotizacionPermiteRespuesta('Pendiente')).toBe(true);
    });

    it('bloquea acciones sobre cotizaciones cerradas o no seleccionadas', () => {
        expect(cotizacionPermiteRespuesta('Aprobada')).toBe(false);
        expect(cotizacionPermiteRespuesta('Rechazada')).toBe(false);
        expect(cotizacionPermiteRespuesta('Anulada')).toBe(false);
    });

    it('calcula el total aprobado usando solo las referencias seleccionadas', () => {
        const items = [
            crearItemCotizacion(1, 10000),
            crearItemCotizacion(2, 20000),
            crearItemCotizacion(3, 30000),
            crearItemCotizacion(4, 40000),
            crearItemCotizacion(5, 50000)
        ];

        expect(calcularTotalReferenciasCotizacion(items, [1, 3, 5])).toBe(90000);
    });

    it('resume referencias aprobadas, no aprobadas, pendientes y total aprobado', () => {
        const items = [
            crearItemCotizacion(1, 10000, 'Aprobada'),
            crearItemCotizacion(2, 20000, 'Aprobada'),
            crearItemCotizacion(3, 30000, 'Rechazada'),
            crearItemCotizacion(4, 40000, 'Pendiente')
        ];

        expect(calcularResumenAprobacionCotizacion(items)).toEqual({
            total: 4,
            aprobadas: 2,
            noAprobadas: 1,
            pendientes: 1,
            totalAprobado: 30000
        });
    });
});

function crearItemCotizacion(id: number, total: number, estado: CotizacionReferenciaProveedor['estado_aprobacion'] = 'Pendiente'): CotizacionReferenciaProveedor {
    return {
        id,
        cotizacion_id: 10,
        pedido_referencia_proveedor_id: id + 100,
        mostrar_referencia: true,
        snapshot_referencia: `REF-${id}`,
        snapshot_descripcion: null,
        snapshot_marca_id: null,
        snapshot_marca: null,
        snapshot_proveedor_id: null,
        snapshot_proveedor_nombre: null,
        snapshot_entrega: null,
        snapshot_cantidad: 1,
        snapshot_valor_unidad: total,
        snapshot_valor_total: total,
        estado_aprobacion: estado,
        aprobada: false,
        fecha_aprobacion: null,
        created_at: '2026-08-01T00:00:00.000Z',
        updated_at: '2026-08-01T00:00:00.000Z'
    };
}
