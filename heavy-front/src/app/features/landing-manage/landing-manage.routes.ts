import { Routes } from '@angular/router';

export const landingManageRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/category-list/category-list.component').then(m => m.CategoryListComponent)
    },
    {
        path: 'machine-types',
        loadComponent: () => import('./pages/machine-type-list/machine-type-list.component').then(m => m.MachineTypeListComponent)
    }
];
