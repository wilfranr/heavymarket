import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../core/auth/services/auth.service';

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
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    private authService = inject(AuthService);

    ngOnInit() {
        const hasAdminRole = this.authService.hasAnyRole(['super_admin', 'Administrador']);
        const hasAnalistaRole = this.authService.hasAnyRole(['Analista', 'analista']);

        this.model = [
            {
                label: 'Principal',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/app'] }]
            }
        ];

        if (hasAdminRole) {
            this.model.push({
                label: 'Administración',
                items: [
                    { label: 'Gestión de Usuarios', icon: 'pi pi-fw pi-id-card', routerLink: ['/app/usuarios'] }
                ]
            });
        }

        this.model.push(
            {
                label: 'Comercial',
                items: [
                    { label: 'Cotizaciones', icon: 'pi pi-fw pi-file', routerLink: ['/app/cotizaciones'] },
                    { label: hasAnalistaRole ? 'Análisis' : 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/app/pedidos'] },
                    { label: 'Órdenes de Trabajo', icon: 'pi pi-fw pi-briefcase', routerLink: ['/app/ordenes-trabajo'] }
                ]
            },
            {
                label: 'Compras',
                items: [
                    { label: 'Órdenes de Compra', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/app/ordenes-compra'] }
                ]
            },
            {
                label: 'Catálogo de Productos',
                items: [
                    { label: 'Máquinas', icon: 'pi pi-fw pi-cog', routerLink: ['/app/maquinas'] },
                    { label: 'Sistemas', icon: 'pi pi-fw pi-wrench', routerLink: ['/app/sistemas'] },
                    { label: 'Listas', icon: 'pi pi-fw pi-list-check', routerLink: ['/app/listas'] },
                    { label: 'Fabricantes', icon: 'pi pi-fw pi-globe', routerLink: ['/app/fabricantes'] },
                    { label: 'Artículos', icon: 'pi pi-fw pi-box', routerLink: ['/app/articulos'] },
                    { label: 'Referencias', icon: 'pi pi-fw pi-hashtag', routerLink: ['/app/referencias'] }
                ]
            },
            {
                label: 'CRM & Terceros',
                items: [
                    { label: 'Terceros', icon: 'pi pi-fw pi-users', routerLink: ['/app/terceros'] },
                    { label: 'Empresas', icon: 'pi pi-fw pi-building', routerLink: ['/app/empresas'] },
                    { label: 'Contactos', icon: 'pi pi-fw pi-address-book', routerLink: ['/app/contactos'] },
                    { label: 'Direcciones', icon: 'pi pi-fw pi-map-marker', routerLink: ['/app/direcciones'] }
                ]
            },
            {
                label: 'Configuración & Logística',
                items: [
                    { label: 'Transportadoras', icon: 'pi pi-fw pi-truck', routerLink: ['/app/transportadoras'] },
                    { label: 'Categorías (ERP)', icon: 'pi pi-fw pi-tags', routerLink: ['/app/categorias'] },
                    { label: 'Tasa de Cambio (TRM)', icon: 'pi pi-fw pi-dollar', routerLink: ['/app/trms'] }
                ]
            }
        );

        if (hasAdminRole) {
            this.model.push({
                label: 'Landing',
                items: [
                    { label: 'Categorías Landing', icon: 'pi pi-fw pi-list', routerLink: ['/app/gestion-landing'] },
                    { label: 'Tipos de Máquina', icon: 'pi pi-fw pi-cog', routerLink: ['/app/gestion-landing/machine-types'] },
                    { label: 'Clientes Interesados', icon: 'pi pi-fw pi-users', routerLink: ['/app/gestion-landing/contact-leads'] }
                ]
            });
        }
    }
}
