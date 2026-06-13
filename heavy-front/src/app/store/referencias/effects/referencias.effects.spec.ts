import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { ReferenciasEffects } from './referencias.effects';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { ToastService } from '../../../core/services/toast.service';
import * as ReferenciasActions from '../actions/referencias.actions';

describe('ReferenciasEffects', () => {
    let actions$: Observable<any>;
    let effects: ReferenciasEffects;
    let referenciaService: jasmine.SpyObj<ReferenciaService>;
    let toastService: jasmine.SpyObj<ToastService>;

    const mockReferencia = {
        id: 1,
        referencia: 'TEST-REF-001',
        marca_id: 10,
        articulo_id: 5,
        es_temporal: false,
        comentario: 'Test comment',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    beforeEach(() => {
        const referenciaServiceSpy = jasmine.createSpyObj('ReferenciaService', ['getAll', 'getById', 'create', 'update', 'deleteReferencia']);
        const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

        TestBed.configureTestingModule({
            providers: [provideMockActions(() => actions$), ReferenciasEffects, { provide: ReferenciaService, useValue: referenciaServiceSpy }, { provide: ToastService, useValue: toastServiceSpy }]
        });

        effects = TestBed.inject(ReferenciasEffects);
        referenciaService = TestBed.inject(ReferenciaService) as jasmine.SpyObj<ReferenciaService>;
        toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    });

    describe('loadReferencias$', () => {
        it('deberia cargar referencias exitosamente', () => {
            const action = ReferenciasActions.loadReferencias({ search: 'test' });
            const outcome = ReferenciasActions.loadReferenciasSuccess({
                referencias: [mockReferencia],
                total: 1,
                currentPage: 1,
                lastPage: 1
            });

            referenciaService.getAll.and.returnValue(
                of({
                    data: [mockReferencia],
                    meta: { total: 1, current_page: 1, last_page: 1, per_page: 15 }
                })
            );

            actions$ = of(action);

            effects.loadReferencias$.subscribe((result) => {
                expect(result).toEqual(outcome);
            });
        });

        it('deberia manejar error al cargar referencias', () => {
            const action = ReferenciasActions.loadReferencias({});
            const outcome = ReferenciasActions.loadReferenciasFailure({ error: 'Error de red' });

            referenciaService.getAll.and.returnValue(throwError(() => ({ error: { message: 'Error de red' } })));

            actions$ = of(action);

            effects.loadReferencias$.subscribe((result) => {
                expect(result).toEqual(outcome);
                expect(toastService.error).toHaveBeenCalledWith('Error de red');
            });
        });
    });

    describe('loadReferenciaById$', () => {
        it('deberia cargar referencia por ID exitosamente', () => {
            const action = ReferenciasActions.loadReferenciaById({ id: 1 });
            const outcome = ReferenciasActions.loadReferenciaByIdSuccess({ referencia: mockReferencia });

            referenciaService.getById.and.returnValue(of({ data: mockReferencia }));

            actions$ = of(action);

            effects.loadReferenciaById$.subscribe((result) => {
                expect(result).toEqual(outcome);
            });
        });

        it('deberia manejar error al cargar referencia por ID', () => {
            const action = ReferenciasActions.loadReferenciaById({ id: 999 });
            const outcome = ReferenciasActions.loadReferenciaByIdFailure({ error: 'Error al cargar la referencia' });

            referenciaService.getById.and.returnValue(throwError(() => ({ error: {} })));

            actions$ = of(action);

            effects.loadReferenciaById$.subscribe((result) => {
                expect(result).toEqual(outcome);
            });
        });
    });

    describe('createReferencia$', () => {
        it('deberia crear referencia exitosamente', () => {
            const createData = { referencia: 'NEW-REF', marca_id: 10 };
            const action = ReferenciasActions.createReferencia({ data: createData });
            const outcome = ReferenciasActions.createReferenciaSuccess({ referencia: mockReferencia });

            referenciaService.create.and.returnValue(of({ data: mockReferencia }));

            actions$ = of(action);

            effects.createReferencia$.subscribe((result) => {
                expect(result).toEqual(outcome);
                expect(toastService.success).toHaveBeenCalledWith('Referencia creada exitosamente');
            });
        });

        it('deberia manejar error de validacion (422)', () => {
            const createData = { referencia: 'DUPLICATE' };
            const action = ReferenciasActions.createReferencia({ data: createData });
            const outcome = ReferenciasActions.createReferenciaFailure({ error: 'La referencia ya existe' });

            referenciaService.create.and.returnValue(
                throwError(() => ({
                    status: 422,
                    error: { errors: { referencia: ['La referencia ya existe'] } }
                }))
            );

            actions$ = of(action);

            effects.createReferencia$.subscribe((result) => {
                expect(result).toEqual(outcome);
                expect(toastService.error).toHaveBeenCalledWith('La referencia ya existe');
            });
        });
    });

    describe('updateReferencia$', () => {
        it('deberia actualizar referencia exitosamente', () => {
            const updateData = { referencia: 'UPDATED-REF' };
            const action = ReferenciasActions.updateReferencia({ id: 1, data: updateData });
            const outcome = ReferenciasActions.updateReferenciaSuccess({ referencia: mockReferencia });

            referenciaService.update.and.returnValue(of({ data: mockReferencia }));

            actions$ = of(action);

            effects.updateReferencia$.subscribe((result) => {
                expect(result).toEqual(outcome);
                expect(toastService.success).toHaveBeenCalledWith('Referencia actualizada exitosamente');
            });
        });
    });

    describe('deleteReferencia$', () => {
        it('deberia eliminar referencia exitosamente', () => {
            const action = ReferenciasActions.deleteReferencia({ id: 1 });
            const outcome = ReferenciasActions.deleteReferenciaSuccess({ id: 1 });

            referenciaService.deleteReferencia.and.returnValue(of({ message: 'Eliminado' }));

            actions$ = of(action);

            effects.deleteReferencia$.subscribe((result) => {
                expect(result).toEqual(outcome);
                expect(toastService.success).toHaveBeenCalledWith('Referencia eliminada exitosamente');
            });
        });

        it('deberia manejar error al eliminar referencia', () => {
            const action = ReferenciasActions.deleteReferencia({ id: 1 });
            const outcome = ReferenciasActions.deleteReferenciaFailure({ error: 'Error' });

            referenciaService.deleteReferencia.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

            actions$ = of(action);

            effects.deleteReferencia$.subscribe((result) => {
                expect(result).toEqual(outcome);
                expect(toastService.error).toHaveBeenCalledWith('Error');
            });
        });
    });
});
