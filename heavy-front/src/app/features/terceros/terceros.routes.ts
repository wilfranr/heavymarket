import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

/**
 * Rutas del módulo de Terceros
 */
export const tercerosRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./list/list').then((m) => m.ListComponent),
                title: 'Lista de Terceros'
            },
            {
                path: 'create',
                loadComponent: () => import('./create/create').then((m) => m.CreateComponent),
                title: 'Crear Tercero'
            },
            {
                path: ':id',
                loadComponent: () => import('./detail/detail').then((m) => m.DetailComponent),
                title: 'Detalle de Tercero'
            },
            {
                path: ':id/edit',
                loadComponent: () => import('./edit/edit').then((m) => m.EditComponent),
                title: 'Editar Tercero'
            }
        ]
    }
];
