import { cotizacionPermiteRespuesta } from './detail.component';

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
        expect(cotizacionPermiteRespuesta('No_Seleccionada')).toBe(false);
    });
});
