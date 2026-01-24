import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const ordenesCompraRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./list/list.component').then(m => m.ListComponent),
                title: 'Lista de Órdenes de Compra'
            },
            {
                path: 'create',
                loadComponent: () => import('./create/create.component').then(m => m.CreateComponent),
                title: 'Crear Orden de Compra'
            },
            {
                path: ':id',
                loadComponent: () => import('./detail/detail.component').then(m => m.DetailComponent),
                title: 'Detalle de Orden de Compra'
            },
            {
                path: ':id/edit',
                loadComponent: () => import('./edit/edit.component').then(m => m.EditComponent),
                title: 'Editar Orden de Compra'
            }
        ]
    }
];
