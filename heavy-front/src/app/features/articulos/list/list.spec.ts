import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StoreModule, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { ListComponent } from './list';
import { MessageService, ConfirmationService } from 'primeng/api';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAllArticulos, selectArticulosLoading, selectArticulosPagination } from '../../../store/articulos/selectors/articulos.selectors';

describe('ArticulosListComponent', () => {
    let component: ListComponent;
    let fixture: ComponentFixture<ListComponent>;
    let store: MockStore;
    let router: Router;

    const initialState = {
        articulos: {
            data: [],
            loading: false,
            pagination: { total: 0, currentPage: 1, lastPage: 1 }
        }
    };

    beforeEach(async () => {
        const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [
                ListComponent,
                StoreModule.forRoot({})
            ],
            providers: [
                provideMockStore({ initialState }),
                { provide: Router, useValue: routerSpy },
                MessageService,
                ConfirmationService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ListComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(MockStore);
        router = TestBed.inject(Router);

        // Mock selectors
        store.overrideSelector(selectAllArticulos, []);
        store.overrideSelector(selectArticulosLoading, false);
        store.overrideSelector(selectArticulosPagination, initialState.articulos.pagination);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should dispatch loadArticulos on init', () => {
        const spy = spyOn(store, 'dispatch');
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });

    it('should navigate to create article', () => {
        component.crearArticulo();
        expect(router.navigate).toHaveBeenCalledWith(['/app/articulos/create']);
    });

    it('should navigate to edit article', () => {
        const mockArticulo = { id: 1 } as any;
        component.editarArticulo(mockArticulo);
        expect(router.navigate).toHaveBeenCalledWith(['/app/articulos', 1, 'edit']);
    });

    it('should call confirm on deleteArticulo', () => {
        const confirmationService = TestBed.inject(ConfirmationService);
        const spy = spyOn(confirmationService, 'confirm');
        const mockArticulo = { id: 1, descripcionEspecifica: 'Test' } as any;
        
        component.eliminarArticulo(mockArticulo);
        
        expect(spy).toHaveBeenCalled();
    });

    it('should update search term and trigger load', fakeAsync(() => {
        const spy = spyOn(store, 'dispatch');
        component.onSearch('motor');
        
        tick(500); // Wait for debounceTime
        
        expect(component.searchTerm).toBe('motor');
        expect(spy).toHaveBeenCalled();
    }));
});
