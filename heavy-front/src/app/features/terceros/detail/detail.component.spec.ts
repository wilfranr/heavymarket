import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';

import { Tercero } from '../../../core/models/tercero.model';
import { selectTercerosLoading } from '../../../store/terceros/selectors/terceros.selectors';
import { DetailComponent } from './detail';
import detailTemplate from './detail.html?raw';

describe('DetailComponent', () => {
    let fixture: ComponentFixture<DetailComponent>;

    const crearTerceroProveedor = (tipo: Tercero['tipo']): Tercero =>
        ({
            id: 1,
            nombre: 'Proveedor de prueba',
            tipo_documento: 'nit',
            numero_documento: '900123456',
            dv: null,
            tipo,
            email: null,
            telefono: '3000000000',
            direccion: null,
            estado: 'activo',
            created_at: '',
            updated_at: '',
            sistemas: [{ id: 1, nombre: 'Sistema heredado' }],
            categorias_comerciales: [{ id: 2, nombre: 'Categoría vigente' }]
        }) as Tercero;

    async function crearComponente(tipo: Tercero['tipo']): Promise<void> {
        const tercero = crearTerceroProveedor(tipo);

        await TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: { params: of({ id: tercero.id }) } },
                { provide: Router, useValue: { navigate: () => undefined } },
                {
                    provide: Store,
                    useValue: {
                        dispatch: () => undefined,
                        select: (selector: unknown) => (selector === selectTercerosLoading ? of(false) : of(tercero))
                    }
                }
            ]
        })
            .overrideComponent(DetailComponent, {
                set: {
                    template: detailTemplate,
                    schemas: [NO_ERRORS_SCHEMA]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(DetailComponent);
        fixture.detectChanges();
    }

    afterEach(() => TestBed.resetTestingModule());

    it.each<Tercero['tipo']>(['Proveedor', 'Ambos'])('no muestra sistemas heredados para %s', async (tipo) => {
        await crearComponente(tipo);

        const contenido = fixture.nativeElement.textContent;

        expect(contenido).not.toContain('Sistemas');
        expect(contenido).not.toContain('Sistema heredado');
        expect(contenido).toContain('Categorías Comerciales');
        expect(contenido).toContain('Categoría vigente');
    });
});
