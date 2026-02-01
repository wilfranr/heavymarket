import { Routes } from '@angular/router';

export const landingManageRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/category-list/category-list.component').then(m => m.CategoryListComponent)
    }
];
