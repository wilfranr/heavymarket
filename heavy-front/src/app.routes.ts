import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/landing/landing';
import { Products } from './app/pages/products/products';
import { ProductDetail } from './app/pages/products/product-detail/product-detail';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/auth/guards/auth.guard';
import { roleGuard } from './app/core/auth/guards/role.guard';

const adminRoles = ['super_admin', 'Administrador'];
const commonRoles = ['super_admin', 'Administrador', 'Analista', 'analista', 'Vendedor', 'vendedor'];
const noVendedorRoles = ['super_admin', 'Administrador', 'Analista', 'analista'];

export const appRoutes: Routes = [
    {
        path: '',
        component: Landing
    },
    {
        path: 'productos',
        component: Products
    },
    {
        path: 'productos/:category/:subcategory',
        component: ProductDetail
    },
    {
        path: 'cotizar',
        loadComponent: () => import('./app/pages/cotizar/cotizar').then((m) => m.Cotizar)
    },
    {
        path: 'app',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes'), canActivate: [roleGuard], data: { roles: adminRoles } },
            { path: 'documentation', component: Documentation, canActivate: [roleGuard], data: { roles: adminRoles } },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes'), canActivate: [roleGuard], data: { roles: adminRoles } },
            { 
                path: 'pedidos', 
                loadChildren: () => import('./app/features/pedidos/pedidos.routes').then((m) => m.pedidosRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'terceros', 
                loadChildren: () => import('./app/features/terceros/terceros.routes').then((m) => m.tercerosRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'cotizaciones', 
                loadChildren: () => import('./app/features/cotizaciones/cotizaciones.routes').then((m) => m.cotizacionesRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'ordenes-compra', 
                loadChildren: () => import('./app/features/ordenes-compra/ordenes-compra.routes').then((m) => m.ordenesCompraRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'ordenes-trabajo', 
                loadChildren: () => import('./app/features/ordenes-trabajo/ordenes-trabajo.routes').then((m) => m.ordenesTrabajoRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'empresas', 
                loadChildren: () => import('./app/features/empresas/empresas.routes').then((m) => m.empresasRoutes),
                canActivate: [roleGuard],
                data: { roles: noVendedorRoles }
            },
            { 
                path: 'categorias', 
                loadChildren: () => import('./app/features/categorias/categorias.routes').then((m) => m.categoriasRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'contactos', 
                loadChildren: () => import('./app/features/contactos/contactos.routes').then((m) => m.contactosRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'direcciones', 
                loadChildren: () => import('./app/features/direcciones/direcciones.routes').then((m) => m.direccionesRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'transportadoras', 
                loadChildren: () => import('./app/features/transportadoras/transportadoras.routes').then((m) => m.transportadorasRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'trms', 
                loadChildren: () => import('./app/features/trms/trms.routes').then((m) => m.trmsRoutes),
                canActivate: [roleGuard],
                data: { roles: noVendedorRoles }
            },
            { 
                path: 'listas', 
                loadChildren: () => import('./app/features/listas/listas.routes').then((m) => m.default),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'sistemas', 
                loadChildren: () => import('./app/features/sistemas/sistemas.routes').then((m) => m.sistemasRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'referencias', 
                loadChildren: () => import('./app/features/referencias/referencias.routes').then((m) => m.referenciasRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'maquinas', 
                loadChildren: () => import('./app/features/maquinas/maquinas.routes').then((m) => m.maquinasRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'articulos', 
                loadChildren: () => import('./app/features/articulos/articulos.routes').then((m) => m.articulosRoutes),
                canActivate: [roleGuard],
                data: { roles: commonRoles }
            },
            { 
                path: 'gestion-landing', 
                loadChildren: () => import('./app/features/landing-manage/landing-manage.routes').then((m) => m.landingManageRoutes),
                canActivate: [roleGuard],
                data: { roles: adminRoles }
            },
            { 
                path: 'usuarios', 
                loadChildren: () => import('./app/features/users/users.routes').then((m) => m.usersRoutes),
                canActivate: [roleGuard],
                data: { roles: adminRoles }
            },
            { path: 'profile', loadComponent: () => import('./app/pages/profile/profile').then((m) => m.Profile) }
        ]
    },
    // { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
