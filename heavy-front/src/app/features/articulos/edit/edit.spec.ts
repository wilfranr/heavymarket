import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreModule, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { EditComponent } from './edit';
import { MessageService } from 'primeng/api';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectArticuloById } from '../../../store/articulos/selectors/articulos.selectors';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { ListaService } from '../../../core/services/lista.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ArticuloEditComponent', () => {
    let component: EditComponent;
    let fixture: ComponentFixture<EditComponent>;
    let store: MockStore;
    let router: Router;
    let referenciaService: jasmine.SpyObj<ReferenciaService>;
    let articuloService: jasmine.SpyObj<ArticuloService>;
    let listaService: jasmine.SpyObj<ListaService>;

    const mockArticulo = {
        id: 1,
        definicion: 'Test',
        descripcionEspecifica: 'Test Desc',
        peso: 10,
        referencias: [{ id: 10, referencia: 'REF1' }]
    } as any;

    const initialState = {
        articulos: {
            entities: {},
            ids: [],
            loading: false
        }
    };

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        const messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);
        const articuloServiceSpy = jasmine.createSpyObj('ArticuloService', ['getById', 'addMedida', 'updateMedida', 'removeMedida']);
        const referenciaServiceSpy = jasmine.createSpyObj('ReferenciaService', ['getAll', 'update', 'create']);
        referenciaServiceSpy.getAll.and.returnValue(of({ data: [], meta: {} }));
        const listaServiceSpy = jasmine.createSpyObj('ListaService', ['getAll', 'getByTipo', 'getMarcasYFabricantesParaReferencia', 'create']);
        listaServiceSpy.getByTipo.and.returnValue(of([]));
        listaServiceSpy.getMarcasYFabricantesParaReferencia.and.returnValue(of([]));

        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, StoreModule.forRoot({})],
            providers: [
                provideMockStore({ initialState }),
                { provide: Router, useValue: routerSpy },
                {
                    provide: ActivatedRoute,
                    useValue: { params: of({ id: 1 }) }
                },
                { provide: MessageService, useValue: messageServiceSpy },
                { provide: ArticuloService, useValue: articuloServiceSpy },
                { provide: ReferenciaService, useValue: referenciaServiceSpy },
                { provide: ListaService, useValue: listaServiceSpy }
            ]
        })
            .overrideComponent(EditComponent, {
                set: {
                    template: '<div></div>',
                    styleUrls: [],
                    imports: [],
                    providers: [
                        { provide: MessageService, useValue: messageServiceSpy },
                        { provide: ArticuloService, useValue: articuloServiceSpy },
                        { provide: ReferenciaService, useValue: referenciaServiceSpy },
                        { provide: ListaService, useValue: listaServiceSpy }
                    ]
                }
            })
            .compileComponents();

        fixture = TestBed.createComponent(EditComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(MockStore);
        router = TestBed.inject(Router);
        referenciaService = TestBed.inject(ReferenciaService) as jasmine.SpyObj<ReferenciaService>;
        articuloService = TestBed.inject(ArticuloService) as jasmine.SpyObj<ArticuloService>;
        listaService = TestBed.inject(ListaService) as jasmine.SpyObj<ListaService>;

        store.overrideSelector(selectArticuloById(1), mockArticulo);

        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form with article data', () => {
        // Forzar inicialización si no ha ocurrido por el async del store en el test
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        expect(component.articuloForm.get('definicion')?.value).toBe('Test');
        expect(component.articuloForm.get('descripcionEspecifica')?.value).toBe('Test Desc');
    });

    it('should have references in FormArray', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        const formArray = component.articuloForm.get('referenciasCruzadas') as FormArray;
        expect(formArray.length).toBe(1);
        expect(formArray.at(0).get('referencia_id')?.value).toBe(10);
    });

    it('should add a new reference row', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.agregarReferencia();
        const formArray = component.articuloForm.get('referenciasCruzadas') as FormArray;
        expect(formArray.length).toBe(2);
    });

    it('should remove a reference row', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        const formArray = component.articuloForm.get('referenciasCruzadas') as FormArray;
        formArray.push(new FormGroup({ referencia_id: new FormControl(20) })); // ensure at least one

        const initialLength = formArray.length;
        component.eliminarReferencia(0);
        expect(formArray.length).toBe(initialLength - 1);
    });

    it('should enable and cancel inline reference editing', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.iniciarEdicionReferencia(0);

        const row = component.referenciasCruzadas.at(0);
        expect(component.editingReferenciaIndex()).toBe(0);
        expect(row.get('referencia')?.value).toBe('REF1');

        component.cancelarEdicionReferencia();

        expect(component.editingReferenciaIndex()).toBeNull();
        expect(row.get('referencia')).toBeNull();
        expect(row.get('marca_id')).toBeNull();
    });

    it('should update a reference from inline editing', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        const actualizada = { ...mockArticulo.referencias[0], referencia: 'REF-EDITADA', marca_id: 5 };
        referenciaService.update.and.returnValue(of({ data: actualizada } as any));

        component.iniciarEdicionReferencia(0);
        const row = component.referenciasCruzadas.at(0);
        row.patchValue({ referencia: 'REF-EDITADA', marca_id: 5 });
        component.guardarEdicionReferencia(0);

        expect(referenciaService.update).toHaveBeenCalledWith(10, {
            referencia: 'REF-EDITADA',
            marca_id: 5,
            articulo_id: null,
            comentario: null
        });
        expect(component.getReferenciaDetail(10)?.referencia).toBe('REF-EDITADA');
        expect(component.editingReferenciaIndex()).toBeNull();
    });

    it('should activate inline creation mode and add referencia/marca_id controls to the row', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.agregarReferencia();
        const index = component.referenciasCruzadas.length - 1;

        component.iniciarCreacionReferencia(index);

        expect(component.creatingReferenciaIndex()).toBe(index);
        expect(component.referenciasCruzadas.at(index).get('referencia')).toBeTruthy();
        expect(component.referenciasCruzadas.at(index).get('marca_id')).toBeTruthy();
    });

    it('should not create a referencia when the input is empty and should mark it touched', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.agregarReferencia();
        const index = component.referenciasCruzadas.length - 1;
        component.iniciarCreacionReferencia(index);

        component.guardarCreacionReferencia(index);

        expect(referenciaService.create).not.toHaveBeenCalled();
        expect(component.referenciasCruzadas.at(index).get('referencia')?.touched).toBe(true);
    });

    it('should create a new referencia associating it directly with articuloId and select it in the row', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.articuloId = 1;
        const nuevaReferencia = { id: 20, referencia: 'REF-NUEVA', marca_id: 9, articulo_id: 1, comentario: null } as any;
        referenciaService.create.and.returnValue(of({ data: nuevaReferencia } as any));

        component.agregarReferencia();
        const index = component.referenciasCruzadas.length - 1;
        component.iniciarCreacionReferencia(index);
        component.referenciasCruzadas.at(index).patchValue({ referencia: 'REF-NUEVA', marca_id: 9 });

        component.guardarCreacionReferencia(index);

        expect(referenciaService.create).toHaveBeenCalledWith({
            referencia: 'REF-NUEVA',
            marca_id: 9,
            articulo_id: 1,
            comentario: null
        });
        expect(component.referenciasCruzadas.at(index).get('referencia_id')?.value).toBe(20);
        expect(component.creatingReferenciaIndex()).toBeNull();
        expect(component.referenciasDisponibles.some((r) => r.id === 20)).toBe(true);
    });

    it('should cancel inline creation without calling the service', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.agregarReferencia();
        const index = component.referenciasCruzadas.length - 1;
        component.iniciarCreacionReferencia(index);

        component.cancelarCreacionReferencia();

        expect(referenciaService.create).not.toHaveBeenCalled();
        expect(component.creatingReferenciaIndex()).toBeNull();
        expect(component.referenciasCruzadas.at(index).get('referencia')).toBeNull();
    });

    it('should not throw when starting an inline creation while a stale out-of-range creatingReferenciaIndex is set (production crash regression)', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        component.creatingReferenciaIndex.set(5);
        component.agregarReferencia();
        const index = component.referenciasCruzadas.length - 1;

        expect(() => component.iniciarCreacionReferencia(index)).not.toThrow();
        expect(component.creatingReferenciaIndex()).toBe(index);
    });

    it('should update a kit reference from inline editing', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }

        const referenciaJuego = { ...mockArticulo.referencias[0], referencia: 'KIT-REF' };
        const actualizada = { ...referenciaJuego, referencia: 'KIT-EDITADA', marca_id: 8 };
        component.referenciasJuegosDisponibles = [referenciaJuego];
        component.agregarJuego();
        component.articuloJuegos.at(0).patchValue({ referencia_id: 10 });
        referenciaService.update.and.returnValue(of({ data: actualizada } as any));

        component.iniciarEdicionReferenciaJuego(0);
        const row = component.articuloJuegos.at(0);
        row.patchValue({ referencia: 'KIT-EDITADA', marca_id: 8 });
        component.guardarEdicionReferenciaJuego(0);

        expect(referenciaService.update).toHaveBeenCalledWith(10, {
            referencia: 'KIT-EDITADA',
            marca_id: 8,
            articulo_id: null,
            comentario: null
        });
        expect(component.getReferenciaJuegoDetail(10)?.referencia).toBe('KIT-EDITADA');
        expect(component.editingReferenciaJuegoIndex()).toBeNull();
    });

    it('should navigate back on cancel', () => {
        component.cancelar();
        expect(router.navigate).toHaveBeenCalledWith(['/app/articulos', 1]);
    });

    it('should update articuloActual.foto_medida when tipo changes (inheritance)', () => {
        if (!component.articuloForm) {
            (component as any).initForm(mockArticulo);
        }
        // Mock data
        const mockTipo = { nombre: 'Abrazadera', fotoMedida: 'inherited.jpg' };
        component.tipos = [mockTipo as any];
        component.articuloActual = { ...mockArticulo } as any;

        // Trigger change
        component.onTipoChange({ value: 'Abrazadera' });

        expect(component.articuloActual?.foto_medida).toBe('inherited.jpg');
        expect(component.planoFile).toBeNull();
    });

    describe('guardarMedida', () => {
        it('should return and do nothing if identificador or valor are missing or editingMedidaId is null', () => {
            component.medidaData = { identificador: '', unidad: 'mm', valor: null, tipo: 'Ancho' };
            component.editingMedidaId = -1;

            component.guardarMedida();

            expect(articuloService.addMedida).not.toHaveBeenCalled();
        });

        it('should call addMedida when editingMedidaId is negative (new local measure) and prevent concurrent calls', () => {
            component.articuloId = 1;
            component.editingMedidaId = -1;
            component.medidaData = { identificador: 'A', unidad: 'mm', valor: 15.5, tipo: 'Ancho' };
            
            articuloService.addMedida.and.returnValue(of({ data: mockArticulo } as any));
            spyOn(component as any, 'reloadArticulo');

            // Primera llamada
            component.guardarMedida();
            // Intentar llamada duplicada concurrente
            component.guardarMedida();

            expect(articuloService.addMedida).toHaveBeenCalledTimes(1);
            expect(articuloService.addMedida).toHaveBeenCalledWith(1, { identificador: 'A', unidad: 'mm', valor: 15.5, tipo: 'Ancho' });
        });

        it('should call updateMedida when editingMedidaId is positive (existing measure)', () => {
            component.articuloId = 1;
            component.editingMedidaId = 5;
            component.medidaData = { identificador: 'B', unidad: 'mm', valor: 20.0, tipo: 'Largo' };
            
            articuloService.updateMedida.and.returnValue(of({ data: mockArticulo } as any));
            spyOn(component as any, 'reloadArticulo');

            component.guardarMedida();

            expect(articuloService.updateMedida).toHaveBeenCalledTimes(1);
            expect(articuloService.updateMedida).toHaveBeenCalledWith(1, 5, { identificador: 'B', unidad: 'mm', valor: 20.0, tipo: 'Largo' });
        });
    });

    describe('medidas inline editing UI flow', () => {
        it('should add a new local measure row and start editing', () => {
            component.articuloActual = { id: 1, medidas: [] } as any;
            component.agregarMedida();
            expect(component.articuloActual.medidas.length).toBe(1);
            expect(component.editingMedidaId).toBeLessThan(0);
            expect(component.medidaData.identificador).toBe('');
        });

        it('should remove a local measure row if negative ID or call removeMedida if positive ID', () => {
            component.articuloId = 1;
            component.articuloActual = { id: 1, medidas: [{ id: -1, identificador: 'A', valor: 10 }] } as any;
            
            // Eliminar local (id < 0)
            component.eliminarMedida(component.articuloActual.medidas[0]);
            expect(component.articuloActual.medidas.length).toBe(0);
            expect(articuloService.removeMedida).not.toHaveBeenCalled();

            // Eliminar persistida (id > 0)
            const medidaPersistida = { id: 10, identificador: 'B', valor: 20 };
            component.articuloActual.medidas = [medidaPersistida];
            articuloService.removeMedida.and.returnValue(of({} as any));
            spyOn(component as any, 'reloadArticulo');

            component.eliminarMedida(medidaPersistida);
            expect(articuloService.removeMedida).toHaveBeenCalledWith(1, 10);
        });

        it('should cancel inline measure editing and restore state', () => {
            component.articuloActual = { id: 1, medidas: [] } as any;
            component.agregarMedida(); // agrega ID -1
            
            expect(component.articuloActual.medidas.length).toBe(1);
            
            component.cancelarEdicionMedida();
            expect(component.articuloActual.medidas.length).toBe(0);
            expect(component.editingMedidaId).toBeNull();
        });

        it('should handle onFilter for Tipo and Unidad of Medida', () => {
            component.onFilterTipoMedida({ filter: 'Ancho' });
            expect(component.currentSearchTipoMedida).toBe('Ancho');

            component.onFilterUnidadMedida({ filter: 'pulgadas' });
            expect(component.currentSearchUnidadMedida).toBe('pulgadas');
        });

        it('should create new list item via API in caliente and set it locally for Tipo and Unidad of Medida', () => {
            const mockItem: any = { id: 100, tipo: 'Tipo de Medida', nombre: 'Espesor' };
            listaService.create.and.returnValue(of(mockItem));
            
            component.medidaData = { identificador: 'D1', valor: 10, tipo: '', unidad: '' };
            component.crearTipoMedidaEnCaliente('Espesor');
            
            expect(listaService.create).toHaveBeenCalledWith({ tipo: 'Tipo de Medida', nombre: 'Espesor' });
            expect(component.tiposMedida()).toContain(mockItem);
            expect(component.medidaData.tipo).toBe('Espesor');
            expect(component.currentSearchTipoMedida).toBe('');

            const mockUnidad: any = { id: 200, tipo: 'Unidad de Medida', nombre: 'mm' };
            listaService.create.and.returnValue(of(mockUnidad));
            
            component.crearUnidadMedidaEnCaliente('mm');
            expect(listaService.create).toHaveBeenCalledWith({ tipo: 'Unidad de Medida', nombre: 'mm' });
            expect(component.unidadesMedida()).toContain(mockUnidad);
            expect(component.medidaData.unidad).toBe('mm');
            expect(component.currentSearchUnidadMedida).toBe('');
        });
    });
});
