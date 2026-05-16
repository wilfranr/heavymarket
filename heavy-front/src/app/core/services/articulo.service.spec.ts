import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ArticuloService } from './articulo.service';
import { Articulo } from '../models/articulo.model';

describe('ArticuloService', () => {
    let service: ArticuloService;
    let httpMock: HttpTestingController;

    const mockArticulo: Articulo = {
        id: 1,
        definicion: 'Acople Dentado',
        descripcionEspecifica: 'Descripción de prueba',
        es_pieza_estandar: true,
        peso: 10.5,
        comentarios: 'Prueba',
        created_at: '2026-04-19T00:00:00Z',
        updated_at: '2026-04-19T00:00:00Z'
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ArticuloService]
        });

        service = TestBed.inject(ArticuloService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get all articles', () => {
        const mockResponse = {
            data: [mockArticulo],
            meta: { total: 1, current_page: 1 }
        };

        service.getAll().subscribe((res) => {
            expect(res.data.length).toBe(1);
            expect(res.data[0].definicion).toBe('Acople Dentado');
        });

        const req = httpMock.expectOne((req) => req.url.includes('/v1/articulos'));
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });

    it('should get article by id', () => {
        service.getById(1).subscribe((res) => {
            expect(res.data.id).toBe(1);
            expect(res.data.definicion).toBe('Acople Dentado');
        });

        const req = httpMock.expectOne((req) => req.url.includes('/v1/articulos/1'));
        expect(req.request.method).toBe('GET');
        req.flush({ data: mockArticulo });
    });

    it('should create article', () => {
        const formData = new FormData();
        formData.append('definicion', 'Nuevo Articulo');

        service.create(formData).subscribe((res) => {
            expect(res.message).toBe('Creado');
        });

        const req = httpMock.expectOne((req) => req.url.includes('/v1/articulos'));
        expect(req.request.method).toBe('POST');
        req.flush({ message: 'Creado', data: mockArticulo });
    });

    it('should update article', () => {
        const formData = new FormData();
        formData.append('definicion', 'Articulo Actualizado');

        service.update(1, formData).subscribe((res) => {
            expect(res.message).toBe('Actualizado');
        });

        const req = httpMock.expectOne((req) => req.url.includes('/v1/articulos/1'));
        expect(req.request.method).toBe('POST'); // Laravel workaround for multipart PUT
        req.flush({ message: 'Actualizado', data: mockArticulo });
    });

    it('should delete article', () => {
        service.deleteArticulo(1).subscribe((res) => {
            expect(res.message).toBe('Eliminado');
        });

        const req = httpMock.expectOne((req) => req.url.includes('/v1/articulos/1'));
        expect(req.request.method).toBe('DELETE');
        req.flush({ message: 'Eliminado' });
    });
});
