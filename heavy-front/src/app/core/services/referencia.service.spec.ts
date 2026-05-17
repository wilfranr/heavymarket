import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReferenciaService } from './referencia.service';
import { Referencia, CreateReferenciaDto, UpdateReferenciaDto } from '../models/referencia.model';

describe('ReferenciaService', () => {
    let service: ReferenciaService;
    let httpMock: HttpTestingController;

    const mockReferencia: Referencia = {
        id: 1,
        referencia: 'TEST-REF-001',
        marca_id: 10,
        articulo_id: 5,
        es_temporal: false,
        comentario: 'Test comment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const mockPaginatedResponse = {
        data: [mockReferencia],
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 1
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ReferenciaService]
        });
        service = TestBed.inject(ReferenciaService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('getAll', () => {
        it('deberia obtener lista paginada de referencias', () => {
            service.getAll().subscribe(response => {
                expect(response.data.length).toBe(1);
                expect(response.data[0].referencia).toBe('TEST-REF-001');
            });

            const req = httpMock.expectOne('/v1/referencias');
            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('deberia enviar parametros de filtro', () => {
            service.getAll({ search: 'test', marca_id: 10, es_temporal: true }).subscribe();

            const req = httpMock.expectOne(req =>
                req.url === '/v1/referencias' &&
                req.params.get('search') === 'test' &&
                req.params.get('marca_id') === '10' &&
                req.params.get('es_temporal') === 'true'
            );
            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });

        it('deberia soportar paginacion', () => {
            service.getAll({ page: 2, per_page: 50 }).subscribe();

            const req = httpMock.expectOne(req =>
                req.params.get('page') === '2' &&
                req.params.get('per_page') === '50'
            );
            expect(req.request.method).toBe('GET');
            req.flush(mockPaginatedResponse);
        });
    });

    describe('getById', () => {
        it('deberia obtener una referencia por ID', () => {
            const mockResponse = { data: mockReferencia };

            service.getById(1).subscribe(response => {
                expect(response.data.id).toBe(1);
                expect(response.data.referencia).toBe('TEST-REF-001');
            });

            const req = httpMock.expectOne('/v1/referencias/1');
            expect(req.request.method).toBe('GET');
            req.flush(mockResponse);
        });
    });

    describe('create', () => {
        it('deberia crear una nueva referencia', () => {
            const createData: CreateReferenciaDto = {
                referencia: 'NEW-REF-001',
                marca_id: 10,
                articulo_id: 5,
                comentario: 'New reference'
            };

            const mockResponse = { data: mockReferencia, message: 'Referencia creada exitosamente' };

            service.create(createData).subscribe(response => {
                expect(response.message).toBe('Referencia creada exitosamente');
            });

            const req = httpMock.expectOne('/v1/referencias');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(createData);
            req.flush(mockResponse);
        });
    });

    describe('update', () => {
        it('deberia actualizar una referencia existente', () => {
            const updateData: UpdateReferenciaDto = {
                referencia: 'UPDATED-REF-001',
                comentario: 'Updated comment'
            };

            const mockResponse = { data: { ...mockReferencia, ...updateData }, message: 'Referencia actualizada exitosamente' };

            service.update(1, updateData).subscribe(response => {
                expect(response.message).toBe('Referencia actualizada exitosamente');
            });

            const req = httpMock.expectOne('/v1/referencias/1');
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);
            req.flush(mockResponse);
        });
    });

    describe('deleteReferencia', () => {
        it('deberia eliminar una referencia', () => {
            const mockResponse = { message: 'Referencia eliminada exitosamente' };

            service.deleteReferencia(1).subscribe(response => {
                expect(response.message).toBe('Referencia eliminada exitosamente');
            });

            const req = httpMock.expectOne('/v1/referencias/1');
            expect(req.request.method).toBe('DELETE');
            req.flush(mockResponse);
        });
    });

    describe('bulkSearch', () => {
        it('deberia buscar referencias existentes por codigos', () => {
            const items = [{ codigo: 'REF-001', cantidad: 2 }, { codigo: 'REF-002', cantidad: 1 }];
            const mockResponse = {
                data: [mockReferencia],
                no_encontrados: ['REF-002'],
                message: '1 referencia(s) encontrada(s)'
            };

            service.bulkSearch(items).subscribe(response => {
                expect(response.data.length).toBe(1);
                expect(response.no_encontrados).toContain('REF-002');
            });

            const req = httpMock.expectOne('/v1/referencias/bulk-search');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ items });
            req.flush(mockResponse);
        });
    });

    describe('bulkSearchOrCreate', () => {
        it('deberia buscar o crear referencias con parametros completos', () => {
            const items = [{ codigo: 'NEW-REF', cantidad: 1 }];
            const mockResponse = { data: [mockReferencia], message: '1 referencia(s) procesada(s) exitosamente' };

            service.bulkSearchOrCreate(items, true, 10, 'Comment', 5, 2).subscribe(response => {
                expect(response.data.length).toBe(1);
            });

            const req = httpMock.expectOne('/v1/referencias/bulk-search-or-create');
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                items,
                es_temporal: true,
                marca_id: 10,
                comentario_temporal: 'Comment',
                articulo_id: 5,
                lista_id: 2
            });
            req.flush(mockResponse);
        });

        it('deberia no enviar parametros opcionales si no se proporcionan', () => {
            const items = [{ codigo: 'NEW-REF', cantidad: 1 }];
            const mockResponse = { data: [mockReferencia] };

            service.bulkSearchOrCreate(items).subscribe();

            const req = httpMock.expectOne('/v1/referencias/bulk-search-or-create');
            expect(req.request.body).toEqual({
                items,
                es_temporal: false
            });
            req.flush(mockResponse);
        });
    });
});