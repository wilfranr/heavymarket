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
        const articuloServiceSpy = jasmine.createSpyObj('ArticuloService', ['getById']);
        const referenciaServiceSpy = jasmine.createSpyObj('ReferenciaService', ['getAll']);
        referenciaServiceSpy.getAll.and.returnValue(of({ data: [], meta: {} }));
        const listaServiceSpy = jasmine.createSpyObj('ListaService', ['getAll', 'getByTipo']);
        listaServiceSpy.getByTipo.and.returnValue(of([]));

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
        }).overrideComponent(EditComponent, {
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
        }).compileComponents();

        fixture = TestBed.createComponent(EditComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(MockStore);
        router = TestBed.inject(Router);

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
});
