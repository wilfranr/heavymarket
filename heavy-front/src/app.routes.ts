import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/auth/guards/auth.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: Landing,
    },
    {
        path: 'app',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'pedidos', loadChildren: () => import('./app/features/pedidos/pedidos.routes').then(m => m.pedidosRoutes) },
            { path: 'terceros', loadChildren: () => import('./app/features/terceros/terceros.routes').then(m => m.tercerosRoutes) },
            { path: 'cotizaciones', loadChildren: () => import('./app/features/cotizaciones/cotizaciones.routes').then(m => m.cotizacionesRoutes) },
            { path: 'ordenes-compra', loadChildren: () => import('./app/features/ordenes-compra/ordenes-compra.routes').then(m => m.ordenesCompraRoutes) },
            { path: 'ordenes-trabajo', loadChildren: () => import('./app/features/ordenes-trabajo/ordenes-trabajo.routes').then(m => m.ordenesTrabajoRoutes) },
            { path: 'empresas', loadChildren: () => import('./app/features/empresas/empresas.routes').then(m => m.empresasRoutes) },
            { path: 'categorias', loadChildren: () => import('./app/features/categorias/categorias.routes').then(m => m.categoriasRoutes) },
            { path: 'contactos', loadChildren: () => import('./app/features/contactos/contactos.routes').then(m => m.contactosRoutes) },
            { path: 'direcciones', loadChildren: () => import('./app/features/direcciones/direcciones.routes').then(m => m.direccionesRoutes) },
            { path: 'transportadoras', loadChildren: () => import('./app/features/transportadoras/transportadoras.routes').then(m => m.transportadorasRoutes) },
            { path: 'listas', loadChildren: () => import('./app/features/listas/listas.routes').then(m => m.default) },
            { path: 'fabricantes', loadChildren: () => import('./app/features/fabricantes/fabricantes.routes').then(m => m.fabricantesRoutes) },
            { path: 'sistemas', loadChildren: () => import('./app/features/sistemas/sistemas.routes').then(m => m.sistemasRoutes) },
            { path: 'referencias', loadChildren: () => import('./app/features/referencias/referencias.routes').then(m => m.referenciasRoutes) },
            { path: 'maquinas', loadChildren: () => import('./app/features/maquinas/maquinas.routes').then(m => m.maquinasRoutes) },
            { path: 'articulos', loadChildren: () => import('./app/features/articulos/articulos.routes').then(m => m.articulosRoutes) }
        ]
    },
    // { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
