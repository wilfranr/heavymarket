import { Routes } from '@angular/router';

/**
 * Rutas del módulo de Listas.
 * Cada vista en chunk propio (loadComponent) para no cargar create/edit/detail al abrir el listado.
 */
export default [
    {
        path: '',
        loadComponent: () => import('./list/list').then((m) => m.ListComponent)
    },
    {
        path: 'create',
        loadComponent: () => import('./create/create').then((m) => m.CreateComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./detail/detail').then((m) => m.DetailComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./edit/edit').then((m) => m.EditComponent)
    }
] as Routes;
