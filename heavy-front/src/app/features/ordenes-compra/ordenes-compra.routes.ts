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
            }
        ]
    }
];
