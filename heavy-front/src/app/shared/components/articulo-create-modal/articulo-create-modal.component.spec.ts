import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { ArticuloService } from '../../../core/services/articulo.service';
import { ListaService } from '../../../core/services/lista.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { Referencia } from '../../../core/models/referencia.model';
import { ArticuloCreateModalComponent } from './articulo-create-modal.component';

describe('ArticuloCreateModalComponent', () => {
    let component: ArticuloCreateModalComponent;
    let referenciaServiceMock: { create: ReturnType<typeof vi.fn>; getAll: ReturnType<typeof vi.fn>; getById: ReturnType<typeof vi.fn> };

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
            getAll: vi.fn().mockReturnValue(of({ data: [] })),
            getById: vi.fn().mockReturnValue(of({ data: referenciaExistente }))
        };

        TestBed.configureTestingModule({
            providers: [
                FormBuilder,
                { provide: ArticuloService, useValue: {} },
                { provide: ListaService, useValue: { getMarcasYFabricantesParaReferencia: () => of([]) } },
                { provide: ReferenciaService, useValue: referenciaServiceMock },
                { provide: MessageService, useValue: { add: vi.fn() } }
            ]
        });

        component = TestBed.runInInjectionContext(() => new ArticuloCreateModalComponent());
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
        expect(component.referenciasCruzadas.at(0).get('referencia')).toBeNull();
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

    it('registra la ultima referencia creada para que el consumidor (p.ej. analisis) pueda seleccionarla', () => {
        component.agregarReferencia();
        component.iniciarCreacionReferencia(0);
        component.referenciasCruzadas.at(0).patchValue({ referencia: 'REF-NUEVA', marca_id: 7 });

        component.guardarCreacionReferencia(0);

        expect(component.ultimaReferenciaCreada?.id).toBe(99);
    });

    it('resetea ultimaReferenciaCreada al cerrar el modal', () => {
        component.ultimaReferenciaCreada = referenciaCreada;

        component.closeDialog();

        expect(component.ultimaReferenciaCreada).toBeNull();
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
});
