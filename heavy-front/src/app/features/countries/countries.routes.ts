import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { roleGuard } from '../../core/auth/guards/role.guard';

const adminRoles = ['super_admin', 'Administrador'];

export const countriesRoutes: Routes = [
    {
        path: '',
        canActivate: [authGuard, roleGuard],
        data: { roles: adminRoles },
        children: [
            {
                path: '',
                loadComponent: () => import('./list/list.component').then((m) => m.ListComponent),
                title: 'Gestión de Países'
            },
            {
                path: ':id/edit',
                loadComponent: () => import('./edit/edit.component').then((m) => m.EditComponent),
                title: 'Editar País'
            }
        ]
    }
];
