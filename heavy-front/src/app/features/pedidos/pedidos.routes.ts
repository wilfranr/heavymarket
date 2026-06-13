import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { pedidoVendedorSoloLecturaEnAnalisisGuard } from './guards/pedido-vendedor-solo-lectura-en-analisis.guard';
import { pedidoSoloLecturaCosteoGuard } from './guards/pedido-solo-lectura-costeo.guard';
import { pedidoSoloLecturaAnalysisGuard } from './guards/pedido-solo-lectura-analysis.guard';

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
                canActivate: [pedidoVendedorSoloLecturaEnAnalisisGuard],
                title: 'Editar Pedido'
            },
            {
                path: ':id/costeo',
                loadComponent: () => import('./costeo/costeo').then((m) => m.CosteoComponent),
                canActivate: [pedidoSoloLecturaCosteoGuard],
                title: 'Costeo'
            },
            {
                path: ':id/analysis',
                loadComponent: () => import('./analysis/analysis').then((m) => m.AnalysisComponent),
                canActivate: [pedidoSoloLecturaAnalysisGuard],
                title: 'Análisis de Pedido'
            }
        ]
    }
];
