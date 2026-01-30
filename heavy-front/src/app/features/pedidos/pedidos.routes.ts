import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

/**
 * Rutas del módulo de Pedidos
 * Todas las rutas requieren autenticación
 */
export const pedidosRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./list/pedidos-list.component').then((m) => m.PedidosListComponent),
                title: 'Lista de Pedidos'
            },
            {
                path: 'create',
                loadComponent: () => import('./create/create').then((m) => m.CreateComponent),
                title: 'Crear Pedido'
            },
            {
                path: ':id',
                loadComponent: () => import('./detail/detail').then((m) => m.DetailComponent),
                title: 'Detalle de Pedido'
            },
            {
                path: ':id/edit',
                loadComponent: () => import('./edit/edit').then((m) => m.EditComponent),
                title: 'Editar Pedido'
            }
        ]
    }
];
