import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Principal',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/app'] }
                ]
            },
            {
                label: 'Ventas',
                items: [
                    { label: 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/app/pedidos'] },
                    { label: 'Cotizaciones', icon: 'pi pi-fw pi-file', routerLink: ['/app/cotizaciones'] },
                    { label: 'Terceros', icon: 'pi pi-fw pi-users', routerLink: ['/app/terceros'] }
                ]
            },
            {
                label: 'Compras',
                items: [
                    { label: 'Órdenes de Compra', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/app/ordenes-compra'] }
                ]
            },
            {
                label: 'Catálogos',
                items: [
                    { label: 'Listas', icon: 'pi pi-fw pi-list-check', routerLink: ['/app/listas'] },
                    { label: 'Fabricantes', icon: 'pi pi-fw pi-bookmark', routerLink: ['/app/fabricantes'] },
                    { label: 'Sistemas', icon: 'pi pi-fw pi-wrench', routerLink: ['/app/sistemas'] },
                    { label: 'Referencias', icon: 'pi pi-fw pi-clipboard', routerLink: ['/app/referencias'] },
                    { label: 'Máquinas', icon: 'pi pi-fw pi-cog', routerLink: ['/app/maquinas'] },
                    { label: 'Artículos', icon: 'pi pi-fw pi-cube', routerLink: ['/app/articulos'] }
                ]
            },
            {
                separator: true
            },
            {
                label: 'Componentes UI (Demo)',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/app/uikit/formlayout'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/app/uikit/table'] },
                    { label: 'Charts', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/app/uikit/charts'] }
                ]
            }
        ];
    }
}
