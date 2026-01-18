import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        children: [
            { path: '', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'pedidos', loadChildren: () => import('./app/features/pedidos/pedidos.routes').then(m => m.pedidosRoutes) },
            { path: 'terceros', loadChildren: () => import('./app/features/terceros/terceros.routes').then(m => m.tercerosRoutes) },
            { path: 'cotizaciones', loadChildren: () => import('./app/features/cotizaciones/cotizaciones.routes').then(m => m.cotizacionesRoutes) },
            { path: 'ordenes-compra', loadChildren: () => import('./app/features/ordenes-compra/ordenes-compra.routes').then(m => m.ordenesCompraRoutes) }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
