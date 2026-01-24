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
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] }
                ]
            },
            {
                label: 'Ventas',
                items: [
                    { label: 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/pedidos'] },
                    { label: 'Cotizaciones', icon: 'pi pi-fw pi-file', routerLink: ['/cotizaciones'] },
                    { label: 'Terceros', icon: 'pi pi-fw pi-users', routerLink: ['/terceros'] }
                ]
            },
            {
                label: 'Compras',
                items: [
                    { label: 'Órdenes de Compra', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/ordenes-compra'] }
                ]
            },
            {
                label: 'Catálogos',
                items: [
                    { label: 'Listas', icon: 'pi pi-fw pi-list-check', routerLink: ['/listas'] },
                    { label: 'Fabricantes', icon: 'pi pi-fw pi-bookmark', routerLink: ['/fabricantes'] },
                    { label: 'Sistemas', icon: 'pi pi-fw pi-wrench', routerLink: ['/sistemas'] },
                    { label: 'Referencias', icon: 'pi pi-fw pi-clipboard', routerLink: ['/referencias'] },
                    { label: 'Máquinas', icon: 'pi pi-fw pi-cog', routerLink: ['/maquinas'] }
                ]
            },
            {
                separator: true
            },
            {
                label: 'Componentes UI (Demo)',
                items: [
                    { label: 'Form Layout', icon: 'pi pi-fw pi-id-card', routerLink: ['/uikit/formlayout'] },
                    { label: 'Table', icon: 'pi pi-fw pi-table', routerLink: ['/uikit/table'] },
                    { label: 'Charts', icon: 'pi pi-fw pi-chart-bar', routerLink: ['/uikit/charts'] }
                ]
            }
        ];
    }
}
