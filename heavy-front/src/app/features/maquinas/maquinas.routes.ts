import { Routes } from '@angular/router';

export const maquinasRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./list/list').then(m => m.ListComponent)
    },
    {
        path: 'create',
        loadComponent: () => import('./create/create').then(m => m.CreateComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./detail/detail').then(m => m.DetailComponent)
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./edit/edit').then(m => m.EditComponent)
    }
];
