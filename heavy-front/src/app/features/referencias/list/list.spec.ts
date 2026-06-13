import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StoreModule, Store, Actions } from '@ngrx/store';
import { of, throwError, Subject } from 'rxjs';
import { ListComponent } from './list';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAllReferencias, selectReferenciasLoading, selectReferenciasPagination } from '../../../store/referencias/selectors/referencias.selectors';
import { loadReferencias, deleteReferencia, updateReferencia, updateReferenciaSuccess } from '../../../store/referencias/actions/referencias.actions';
import { Referencia } from '../../../core/models/referencia.model';
import { ListaService } from '../../../core/services/lista.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { Lista } from '../../../core/models/lista.model';
import { Articulo } from '../../../core/models/articulo.model';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ReferenciasListComponent', () => {
    let component: ListComponent;
    let fixture: ComponentFixture<ListComponent>;
    let store: MockStore;
    let router: { navigate: ReturnType<typeof vi.fn> };
    let confirmationService: ConfirmationService;
    let listaService: { getMarcasYFabricantesParaReferencia: ReturnType<typeof vi.fn> };
    let articuloService: { getAll: ReturnType<typeof vi.fn> };

    const mockReferencias: Referencia[] = [
        { id: 1, referencia: 'REF-001', marca_id: 10, articulo_id: 5, es_temporal: false, comentario: 'Test 1', created_at: '2024-01-01', updated_at: '2024-01-01' },
        { id: 2, referencia: 'REF-002', marca_id: 11, articulo_id: null, es_temporal: true, comentario: 'Test 2', created_at: '2024-01-02', updated_at: '2024-01-02' }
    ];

    const initialState = {
        referencias: {
            data: [],
            entities: {},
            ids: [],
            loading: false,
            error: null,
            total: 0,
            currentPage: 1,
            lastPage: 1
        }
    };

    const mockMarcas: Lista[] = [
        { id: 10, nombre: 'Marca A', tipo: 'Marca' },
        { id: 11, nombre: 'Marca B', tipo: 'Fabricantes' }
    ];

    const mockArticulos: Articulo[] = [
        { id: 5, definicion: 'Articulo A', descripcionEspecifica: 'Desc A' },
        { id: 6, definicion: 'Articulo B', descripcionEspecifica: 'Desc B' }
    ];

    beforeEach(async () => {
        router = { navigate: vi.fn() };
        listaService = { getMarcasYFabricantesParaReferencia: vi.fn().mockReturnValue(of(mockMarcas)) };
        articuloService = { getAll: vi.fn().mockReturnValue(of({ data: mockArticulos, meta: { total: 2, current_page: 1, last_page: 1, per_page: 500 } })) };
        const confirmationServiceSpy = { confirm: vi.fn() };
        const messageServiceSpy = { add: vi.fn() };

        await TestBed.configureTestingModule({
            imports: [StoreModule.forRoot({})],
            providers: [
                provideMockStore({ initialState }),
                { provide: Router, useValue: router },
                { provide: ListaService, useValue: listaService },
                { provide: ArticuloService, useValue: articuloService },
                { provide: MessageService, useValue: messageServiceSpy },
                { provide: ConfirmationService, useValue: confirmationServiceSpy }
            ]
        })
            .overrideComponent(ListComponent, {
                set: {
                    template: '<div></div>',
                    styleUrls: [],
                    imports: [],
                    providers: [
                        { provide: MessageService, useValue: messageServiceSpy },
                        { provide: ConfirmationService, useValue: confirmationServiceSpy }
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ListComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(MockStore);
        confirmationService = TestBed.inject(ConfirmationService);

        store.overrideSelector(selectAllReferencias, mockReferencias);
        store.overrideSelector(selectReferenciasLoading, false);
        store.overrideSelector(selectReferenciasPagination, { total: 2, currentPage: 1, lastPage: 1 });

        fixture.detectChanges();
    });

    describe('Inicializacion', () => {
        it('deberia crear el componente', () => {
            expect(component).toBeTruthy();
        });

        it('deberia cargar marcas al inicializar', () => {
            expect(listaService.getMarcasYFabricantesParaReferencia).toHaveBeenCalled();
            expect(component.marcas.length).toBe(2);
        });

        it('deberia cargar articulos al inicializar', () => {
            expect(articuloService.getAll).toHaveBeenCalledWith({ per_page: 500 });
            expect(component.articulos.length).toBe(2);
        });

        it('deberia hacer dispatch de loadReferencias al inicializar', () => {
            const spy = vi.spyOn(store, 'dispatch');
            component.ngOnInit();
            expect(spy).toHaveBeenCalledWith(
                loadReferencias({
                    page: 1,
                    per_page: 20,
                    sort_by: 'created_at',
                    sort_order: 'desc'
                })
            );
        });
    });

    describe('Filtros y Paginacion', () => {
        it('deberia hacer dispatch con filtros al cargar referencias', () => {
            const spy = vi.spyOn(store, 'dispatch');
            component.searchTerm = 'motor';
            component.selectedMarcaId = 10;
            component.filterTemporales = true;
            component.cargarReferencias();

            expect(spy).toHaveBeenCalledWith(
                loadReferencias({
                    page: 1,
                    per_page: 20,
                    search: 'motor',
                    marca_id: 10,
                    es_temporal: true,
                    sort_by: 'created_at',
                    sort_order: 'desc'
                })
            );
        });

        it('deberia resetear paginacion al cambiar marca', () => {
            component.first = 40;
            component.currentPage = 3;
            component.onMarcaChange();

            expect(component.first).toBe(0);
            expect(component.currentPage).toBe(1);
        });

        it('deberia resetear paginacion al cambiar filtro temporales', () => {
            component.first = 40;
            component.currentPage = 3;
            component.onTemporalChange();

            expect(component.first).toBe(0);
            expect(component.currentPage).toBe(1);
        });

        it('deberia calcular pagina correcta en onLazyLoad', () => {
            component.onLazyLoad({ first: 40, rows: 20 });
            expect(component.currentPage).toBe(3);
            expect(component.rowsPerPage).toBe(20);
        });

        it('deberia actualizar searchTerm en onLazyLoad con globalFilter', () => {
            component.onLazyLoad({ first: 0, rows: 20, globalFilter: 'motor' });
            expect(component.searchTerm).toBe('motor');
        });

        it('deberia actualizar ordenamiento en onLazyLoad con sortField', () => {
            component.onLazyLoad({ first: 0, rows: 20, sortField: 'referencia', sortOrder: 1 });
            expect(component.sortBy).toBe('referencia');
            expect(component.sortOrder).toBe('asc');
        });

        it('deberia manejar ordenamiento descendente en onLazyLoad', () => {
            component.onLazyLoad({ first: 0, rows: 20, sortField: 'referencia', sortOrder: -1 });
            expect(component.sortOrder).toBe('desc');
        });
    });

    describe('Navegacion', () => {
        it('deberia abrir modal para crear referencia', () => {
            component.crearReferencia();
            expect(component.showCreateModal).toBe(true);
        });

        it('deberia navegar a detalle de referencia', () => {
            const ref = { id: 1, referencia: 'REF-001' } as Referencia;
            component.verDetalle(ref);
            expect(router.navigate).toHaveBeenCalledWith(['/app/referencias', 1]);
        });

        it('deberia navegar a editar referencia', () => {
            const ref = { id: 1, referencia: 'REF-001' } as Referencia;
            component.editarReferencia(ref);
            expect(router.navigate).toHaveBeenCalledWith(['/app/referencias', 1, 'edit']);
        });

        it('deberia recargar referencias al crear referencia', () => {
            const spy = vi.spyOn(component, 'cargarReferencias');
            component.onReferenciaCreada();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Edicion Inline', () => {
        it('deberia iniciar edicion de referencia', () => {
            const ref = mockReferencias[0];
            component.onRowEditInit(ref);
            expect(component.editingReferencias[1]).toEqual(ref);
        });

        it('deberia guardar edicion y hacer dispatch de update', () => {
            const ref = mockReferencias[0];
            component.onRowEditInit(ref);
            component.editingReferencias[1].referencia = 'REF-UPDATED';

            const spy = vi.spyOn(store, 'dispatch');
            component.guardarEdicion(ref);

            expect(spy).toHaveBeenCalledWith(
                updateReferencia({
                    id: 1,
                    data: {
                        referencia: 'REF-UPDATED',
                        marca_id: 10,
                        articulo_id: 5,
                        comentario: 'Test 1'
                    }
                })
            );
        });

        it('deberia cancelar edicion y restaurar valores originales', () => {
            const ref = { ...mockReferencias[0] };
            component.onRowEditInit(ref);
            ref.referencia = 'MODIFIED';

            component.cancelarEdicion(ref);

            expect(ref.referencia).toBe('REF-001');
            expect(component.editingReferencias[1]).toBeUndefined();
        });
    });

    describe('Eliminacion', () => {
        it('deberia llamar a confirmacion para eliminar', () => {
            const spy = vi.spyOn(confirmationService, 'confirm');
            const ref = mockReferencias[0];

            component.eliminarReferencia(ref);

            expect(spy).toHaveBeenCalled();
            const callArgs = spy.mock.calls[0][0];
            expect(callArgs.message).toContain('REF-001');
        });

        it('deberia hacer dispatch de deleteReferencia al confirmar', () => {
            const spy = vi.spyOn(store, 'dispatch');
            const ref = mockReferencias[0];

            vi.spyOn(confirmationService, 'confirm').mockImplementation((config: any) => {
                config.accept();
            });

            component.eliminarReferencia(ref);

            expect(spy).toHaveBeenCalledWith(deleteReferencia({ id: 1 }));
        });
    });
});
