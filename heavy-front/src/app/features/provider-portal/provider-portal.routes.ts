import { Routes } from '@angular/router';
import { providerGuard } from '../../core/auth/guards/provider.guard';

export const providerPortalRoutes: Routes = [
    {
        path: '',
        canActivate: [providerGuard],
        children: [
            {
                path: 'opportunities',
                loadComponent: () => import('./costing-opportunities/costing-opportunities.component').then((m) => m.CostingOpportunitiesComponent),
                title: 'Oportunidades de Costeo'
            },
            {
                path: 'ordenes-compra',
                loadComponent: () => import('./ordenes-compra/ordenes-compra-list.component').then((m) => m.OrdenesCompraListComponent),
                title: 'Mis Órdenes de Compra'
            },
            {
                path: '',
                redirectTo: 'opportunities',
                pathMatch: 'full'
            }
        ]
    }
];
