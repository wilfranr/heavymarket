import { Routes } from '@angular/router';
import { ListComponent } from './list/list';
import { CreateComponent } from './create/create';
import { EditComponent } from './edit/edit';
import { DetailComponent } from './detail/detail';

/**
 * Rutas del módulo de Listas
 */
export default [
    {
        path: '',
        component: ListComponent,
    },
    {
        path: 'create',
        component: CreateComponent,
    },
    {
        path: ':id',
        component: DetailComponent,
    },
    {
        path: ':id/edit',
        component: EditComponent,
    },
] as Routes;
