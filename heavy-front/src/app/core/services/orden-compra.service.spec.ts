import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OrdenCompraService } from './orden-compra.service';
import { RecepcionCompra, RegistrarRecepcionPayload } from '../models/recepcion-compra.model';

describe('OrdenCompraService', () => {
    let service: OrdenCompraService;
    let httpMock: HttpTestingController;

    const mockRecepcion: RecepcionCompra = {
        id: 1,
        orden_trabajo_id: null,
        orden_compra_id: 10,
        recibido_por: 5,
        fecha_recepcion: new Date().toISOString(),
        numero_remision: 'REM-001',
        observaciones: null,
        estado: 'Activa',
        anulada_por: null,
        fecha_anulacion: null,
        motivo_anulacion: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [OrdenCompraService]
        });
        service = TestBed.inject(OrdenCompraService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('registrarRecepcion', () => {
        it('deberia registrar una recepcion desde la orden de compra', () => {
            const payload: RegistrarRecepcionPayload = {
                fecha_recepcion: new Date().toISOString(),
                numero_remision: 'REM-001',
                detalles: [{ orden_compra_detalle_id: 1, cantidad_recibida: 5, cantidad_conforme: 5, cantidad_rechazada: 0 }]
            };

            service.registrarRecepcion(10, payload).subscribe((recepcion) => {
                expect(recepcion.id).toBe(1);
                expect(recepcion.orden_trabajo_id).toBeNull();
            });

            const req = httpMock.expectOne('/v1/ordenes-compra/10/recepciones');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(payload);
            req.flush({ data: mockRecepcion });
        });

        it('deberia propagar un error 4xx', () => {
            const payload: RegistrarRecepcionPayload = {
                fecha_recepcion: new Date().toISOString(),
                detalles: [{ orden_compra_detalle_id: 1, cantidad_recibida: 5, cantidad_conforme: 5, cantidad_rechazada: 0 }]
            };

            service.registrarRecepcion(10, payload).subscribe({
                next: () => {
                    throw new Error('no deberia emitir un valor exitoso');
                },
                error: (error) => {
                    expect(error.status).toBe(422);
                }
            });

            const req = httpMock.expectOne('/v1/ordenes-compra/10/recepciones');
            req.flush({ message: 'Error de validacion' }, { status: 422, statusText: 'Unprocessable Entity' });
        });
    });

    describe('listarRecepciones', () => {
        it('deberia listar el historial de entregas de una orden de compra', () => {
            service.listarRecepciones(10).subscribe((recepciones) => {
                expect(recepciones.length).toBe(1);
                expect(recepciones[0].id).toBe(1);
            });

            const req = httpMock.expectOne('/v1/ordenes-compra/10/recepciones');
            expect(req.request.method).toBe('GET');
            req.flush({ data: [mockRecepcion] });
        });
    });

    describe('adjuntarImagenRecepcion', () => {
        it('deberia enviar la imagen como FormData', () => {
            const file = new File(['contenido'], 'guia.jpg', { type: 'image/jpeg' });

            service.adjuntarImagenRecepcion(1, file, 'foto').subscribe((imagen) => {
                expect(imagen.id).toBe(9);
                expect(imagen.tipo).toBe('foto');
            });

            const req = httpMock.expectOne('/v1/recepciones-compra/1/imagenes');
            expect(req.request.method).toBe('POST');
            expect(req.request.body instanceof FormData).toBe(true);
            expect((req.request.body as FormData).get('tipo')).toBe('foto');

            req.flush({
                data: {
                    id: 9,
                    recepcion_compra_id: 1,
                    ruta: 'recepciones/1/guia.jpg',
                    nombre_original: 'guia.jpg',
                    mime: 'image/jpeg',
                    size: 123,
                    tipo: 'foto',
                    creado_por: 5,
                    created_at: new Date().toISOString()
                }
            });
        });
    });
});
