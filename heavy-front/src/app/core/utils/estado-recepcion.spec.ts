import { estadoRecepcionLabel, estadoRecepcionSeverity } from './estado-recepcion';

describe('estado-recepcion', () => {
    describe('estadoRecepcionSeverity', () => {
        it('mapea Recibida a success', () => {
            expect(estadoRecepcionSeverity('Recibida')).toBe('success');
        });

        it('mapea Recibida parcialmente a warn', () => {
            expect(estadoRecepcionSeverity('Recibida parcialmente')).toBe('warn');
        });

        it('mapea En tránsito a info', () => {
            expect(estadoRecepcionSeverity('En tránsito')).toBe('info');
        });

        it('mapea null a info (sin badge visible en la práctica)', () => {
            expect(estadoRecepcionSeverity(null)).toBe('info');
        });
    });

    describe('estadoRecepcionLabel', () => {
        it('retorna el valor del estado cuando existe', () => {
            expect(estadoRecepcionLabel('Recibida parcialmente')).toBe('Recibida parcialmente');
        });

        it('retorna un label por defecto cuando es null', () => {
            expect(estadoRecepcionLabel(null)).toBe('Sin recepción');
        });
    });
});
