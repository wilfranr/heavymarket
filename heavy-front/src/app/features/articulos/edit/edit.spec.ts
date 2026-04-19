import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormArray } from '@angular/forms';
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
        referencias: [{ id: 10, referencia: 'REF1' }]
    };

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [
                EditComponent,
                ReactiveFormsModule,
                HttpClientTestingModule,
                StoreModule.forRoot({})
            ],
            providers: [
                provideMockStore(),
                { provide: Router, useValue: routerSpy },
                {
                    provide: ActivatedRoute,
                    useValue: { params: of({ id: 1 }) }
                },
                MessageService,
                ArticuloService,
                ReferenciaService,
                ListaService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(MockStore);
        router = TestBed.inject(Router);

        store.overrideSelector(selectArticuloById(1), mockArticulo);
        
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form with article data', () => {
        expect(component.articuloForm.get('definicion')?.value).toBe('Test');
        expect(component.articuloForm.get('descripcionEspecifica')?.value).toBe('Test Desc');
    });

    it('should have references in FormArray', () => {
        const formArray = component.articuloForm.get('referenciasCruzadas') as FormArray;
        expect(formArray.length).toBe(1);
        expect(formArray.at(0).get('referencia_id')?.value).toBe(10);
    });

    it('should add a new reference row', () => {
        component.agregarReferencia();
        const formArray = component.articuloForm.get('referenciasCruzadas') as FormArray;
        expect(formArray.length).toBe(2);
    });

    it('should remove a reference row', () => {
        component.eliminarReferencia(0);
        const formArray = component.articuloForm.get('referenciasCruzadas') as FormArray;
        expect(formArray.length).toBe(0);
    });

    it('should navigate back on cancel', () => {
        component.cancelar();
        expect(router.navigate).toHaveBeenCalledWith(['/app/articulos', 1]);
    });
});
