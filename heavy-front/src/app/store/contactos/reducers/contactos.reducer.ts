import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Contacto } from '../../../core/models/contacto.model';
import * as ContactosActions from '../actions/contactos.actions';

/**
 * Estado de los contactos usando EntityAdapter para mejor gestión
 */
export interface ContactosState extends EntityState<Contacto> {
    loading: boolean;
    error: string | null;
    total: number;
    currentPage: number;
    lastPage: number;
}

export const adapter: EntityAdapter<Contacto> = createEntityAdapter<Contacto>({
    selectId: (contacto: Contacto) => contacto.id,
    sortComparer: (a: Contacto, b: Contacto) => a.nombre.localeCompare(b.nombre)
});

const initialState: ContactosState = adapter.getInitialState({
    loading: false,
    error: null,
    total: 0,
    currentPage: 1,
    lastPage: 1
});

export const contactosReducer = createReducer(
    initialState,

    // Cargar contactos
    on(ContactosActions.loadContactos, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ContactosActions.loadContactosSuccess, (state, { contactos, total, currentPage, lastPage }) => {
        return adapter.setAll(contactos, {
            ...state,
            loading: false,
            error: null,
            total,
            currentPage,
            lastPage
        });
    }),

    on(ContactosActions.loadContactosFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Cargar contacto por ID
    on(ContactosActions.loadContactoById, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ContactosActions.loadContactoByIdSuccess, (state, { contacto }) => {
        return adapter.upsertOne(contacto, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ContactosActions.loadContactoByIdFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Crear contacto
    on(ContactosActions.createContacto, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ContactosActions.createContactoSuccess, (state, { contacto }) => {
        return adapter.addOne(contacto, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ContactosActions.createContactoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Actualizar contacto
    on(ContactosActions.updateContacto, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ContactosActions.updateContactoSuccess, (state, { contacto }) => {
        return adapter.updateOne(
            { id: contacto.id, changes: contacto },
            {
                ...state,
                loading: false,
                error: null
            }
        );
    }),

    on(ContactosActions.updateContactoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Eliminar contacto
    on(ContactosActions.deleteContacto, (state) => ({
        ...state,
        loading: true,
        error: null
    })),

    on(ContactosActions.deleteContactoSuccess, (state, { id }) => {
        return adapter.removeOne(id, {
            ...state,
            loading: false,
            error: null
        });
    }),

    on(ContactosActions.deleteContactoFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    // Resetear estado
    on(ContactosActions.resetContactosState, () => initialState)
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
