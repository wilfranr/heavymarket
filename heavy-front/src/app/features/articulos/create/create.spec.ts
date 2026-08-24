import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { ArticuloService } from '../../../core/services/articulo.service';
import { ListaService } from '../../../core/services/lista.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { Referencia } from '../../../core/models/referencia.model';
import { CreateComponent } from './create';

describe('ArticuloCreateComponent (Referencias Cruzadas inline)', () => {
    let component: CreateComponent;
    let referenciaServiceMock: { create: ReturnType<typeof vi.fn>; getAll: ReturnType<typeof vi.fn> };

    const referenciaExistente: Referencia = {
        id: 1,
        referencia: 'REF-EXISTENTE',
        articulo_id: null,
        marca_id: 5,
        comentario: null,
        created_at: '',
        updated_at: ''
    };

    const referenciaCreada: Referencia = {
        id: 99,
        referencia: 'REF-NUEVA',
        articulo_id: null,
        marca_id: 7,
        comentario: null,
        created_at: '',
        updated_at: ''
    };

    beforeEach(() => {
        referenciaServiceMock = {
            create: vi.fn().mockReturnValue(of({ data: referenciaCreada })),
            getAll: vi.fn().mockReturnValue(of({ data: [] }))
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: Store, useValue: { dispatch: vi.fn(), select: vi.fn().mockReturnValue(of(null)) } },
                { provide: Router, useValue: { navigate: vi.fn() } },
                { provide: MessageService, useValue: { add: vi.fn() } },
                { provide: ListaService, useValue: { getMarcasYFabricantesParaReferencia: () => of([]) } },
                { provide: ReferenciaService, useValue: referenciaServiceMock },
                { provide: ArticuloService, useValue: {} }
            ]
        });

        component = TestBed.runInInjectionContext(() => new CreateComponent());
        (component as any).initForm();
        component.referenciasDisponibles = [referenciaExistente];
    });

    it('activa el modo de creacion inline y agrega los controles referencia y marca_id a la fila', () => {
        component.agregarReferencia();

        component.iniciarCreacionReferencia(0);

        expect(component.creatingReferenciaIndex()).toBe(0);
        expect(component.referenciasCruzadas.at(0).get('referencia')).toBeTruthy();
        expect(component.referenciasCruzadas.at(0).get('marca_id')).toBeTruthy();
    });

    it('cancela la edicion inline en curso al iniciar una creacion en otra fila', () => {
        component.referenciasCruzadas.push((component as any).fb.group({ referencia_id: [1] }));
        component.iniciarEdicionReferencia(0);
        expect(component.editingReferenciaIndex()).toBe(0);

        component.agregarReferencia();
        component.iniciarCreacionReferencia(1);

        expect(component.editingReferenciaIndex()).toBeNull();
        expect(component.creatingReferenciaIndex()).toBe(1);
    });

    it('no crea la referencia si el codigo esta vacio y marca el control como touched', () => {
        component.agregarReferencia();
        component.iniciarCreacionReferencia(0);

        component.guardarCreacionReferencia(0);

        expect(referenciaServiceMock.create).not.toHaveBeenCalled();
        expect(component.referenciasCruzadas.at(0).get('referencia')?.touched).toBe(true);
    });

    it('crea la referencia sin articulo_id (el articulo aun no existe), la asocia a la fila y sale del modo de creacion', () => {
        component.agregarReferencia();
        component.iniciarCreacionReferencia(0);
        component.referenciasCruzadas.at(0).patchValue({ referencia: 'REF-NUEVA', marca_id: 7 });

        component.guardarCreacionReferencia(0);

        expect(referenciaServiceMock.create).toHaveBeenCalledWith({
            referencia: 'REF-NUEVA',
            marca_id: 7,
            articulo_id: null,
            comentario: null
        });
        expect(component.referenciasCruzadas.at(0).get('referencia_id')?.value).toBe(99);
        expect(component.creatingReferenciaIndex()).toBeNull();
        expect(component.referenciasDisponibles.some((r) => r.id === 99)).toBe(true);
    });

    it('cancela la creacion inline sin llamar al servicio', () => {
        component.agregarReferencia();
        component.iniciarCreacionReferencia(0);

        component.cancelarCreacionReferencia();

        expect(referenciaServiceMock.create).not.toHaveBeenCalled();
        expect(component.creatingReferenciaIndex()).toBeNull();
        expect(component.referenciasCruzadas.at(0).get('referencia')).toBeNull();
    });

    it('mantiene el flujo de edicion inline previo (seleccionar referencia existente y editarla) sin regresiones', () => {
        component.referenciasCruzadas.push((component as any).fb.group({ referencia_id: [1] }));

        component.iniciarEdicionReferencia(0);

        expect(component.editingReferenciaIndex()).toBe(0);
        expect(component.referenciasCruzadas.at(0).get('referencia')?.value).toBe('REF-EXISTENTE');

        component.cancelarEdicionReferencia();

        expect(component.editingReferenciaIndex()).toBeNull();
        expect(component.referenciasCruzadas.at(0).get('referencia')).toBeNull();
    });

    it('no lanza error de runtime al iniciar una creacion cuando queda un indice de creacion obsoleto y fuera de rango (regresion del crash de produccion)', () => {
        component.creatingReferenciaIndex.set(5);

        component.agregarReferencia();

        expect(() => component.iniciarCreacionReferencia(0)).not.toThrow();
        expect(component.creatingReferenciaIndex()).toBe(0);
    });
});
