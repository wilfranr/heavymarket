import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../core/auth/services/auth.service';
import { ProviderAuthService } from '../../core/auth/services/provider-auth.service';

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
    private providerAuthService = inject(ProviderAuthService);

    ngOnInit() {
        const hasAdminRole = this.authService.hasAnyRole(['super_admin', 'Administrador']);
        const hasAnalistaRole = this.authService.hasAnyRole(['Analista', 'analista']);
        const hasVendedorRole = this.authService.hasAnyRole(['Vendedor', 'vendedor']);
        const hasLogisticaRole = this.authService.hasAnyRole(['Logistica', 'logistica']);
        const hasClienteRole = this.authService.hasAnyRole(['Cliente', 'cliente']);
        const hasProveedorRole = this.authService.hasAnyRole(['Proveedor', 'proveedor']);

        // Caso 1: Sesión de Proveedor (Detección unificada)
        if (this.providerAuthService.isProvider() || hasProveedorRole) {
            this.model = [
                {
                    label: 'Portal de Proveedores',
                    items: [
                        { label: 'Oportunidades de Costeo', icon: 'pi pi-fw pi-bolt', routerLink: ['/provider/opportunities'] },
                        { label: 'Mis Órdenes de Compra', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/provider/ordenes-compra'] }
                    ]
                },
                {
                    label: 'Perfil',
                    items: [{ label: 'Cerrar Sesión', icon: 'pi pi-fw pi-sign-out', command: () => (hasProveedorRole ? this.authService.logout().subscribe() : this.providerAuthService.logout()) }]
                }
            ];
            return;
        }

        // Caso 2: Sesión Interna (Asesores, Analistas, Admin)

        // Caso especial: Logistica solo ve Órdenes de Trabajo
        if (hasLogisticaRole && !hasAdminRole) {
            this.model = [
                {
                    label: 'Operaciones',
                    items: [{ label: 'Órdenes de Trabajo', icon: 'pi pi-fw pi-briefcase', routerLink: ['/app/ordenes-trabajo'] }]
                },
                {
                    label: 'Perfil',
                    items: [{ label: 'Cerrar Sesión', icon: 'pi pi-fw pi-sign-out', command: () => this.authService.logout() }]
                }
            ];
            return;
        }

        // Caso especial: Analista (y no Admin) solo ve lo solicitado
        if (hasAnalistaRole && !hasAdminRole) {
            this.model = [
                {
                    label: 'Comercial',
                    items: [{ label: 'Análisis', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/app/pedidos'] }]
                },
                {
                    label: 'Catálogo de Productos',
                    items: [
                        { label: 'Máquinas', icon: 'pi pi-fw pi-cog', routerLink: ['/app/maquinas'] },
                        { label: 'Sistemas', icon: 'pi pi-fw pi-wrench', routerLink: ['/app/sistemas'] },
                        { label: 'Listas', icon: 'pi pi-fw pi-list-check', routerLink: ['/app/listas'] },
                        { label: 'Artículos', icon: 'pi pi-fw pi-box', routerLink: ['/app/articulos'] },
                        { label: 'Referencias', icon: 'pi pi-fw pi-hashtag', routerLink: ['/app/referencias'] }
                    ]
                }
            ];
            return;
        }

        // Caso especial: Cliente (Solo ve sus pedidos)
        if (hasClienteRole && !hasAdminRole && !hasVendedorRole && !hasAnalistaRole && !hasLogisticaRole) {
            this.model = [
                {
                    label: 'Mi Cuenta',
                    items: [{ label: 'Mis Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/app/pedidos'] }]
                },
                {
                    label: 'Perfil',
                    items: [{ label: 'Cerrar Sesión', icon: 'pi pi-fw pi-sign-out', command: () => this.authService.logout() }]
                }
            ];
            return;
        }

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
                    { label: 'Gestión de Usuarios', icon: 'pi pi-fw pi-id-card', routerLink: ['/app/usuarios'] },
                    { label: 'Gestión de Países', icon: 'pi pi-fw pi-globe', routerLink: ['/app/countries'] }
                ]
            });
        }

        this.model.push(
            {
                label: 'Comercial',
                items: [
                    { label: 'Cotizaciones', icon: 'pi pi-fw pi-file', routerLink: ['/app/cotizaciones'] },
                    { label: 'Pedidos', icon: 'pi pi-fw pi-shopping-cart', routerLink: ['/app/pedidos'] },
                    { label: 'Órdenes de Trabajo', icon: 'pi pi-fw pi-briefcase', routerLink: ['/app/ordenes-trabajo'] }
                ]
            },
            {
                label: 'Compras',
                items: [{ label: 'Órdenes de Compra', icon: 'pi pi-fw pi-shopping-bag', routerLink: ['/app/ordenes-compra'] }]
            },
            {
                label: 'Catálogo de Productos',
                items: [
                    { label: 'Máquinas', icon: 'pi pi-fw pi-cog', routerLink: ['/app/maquinas'] },
                    { label: 'Sistemas', icon: 'pi pi-fw pi-wrench', routerLink: ['/app/sistemas'] },
                    { label: 'Listas', icon: 'pi pi-fw pi-list-check', routerLink: ['/app/listas'] },
                    { label: 'Artículos', icon: 'pi pi-fw pi-box', routerLink: ['/app/articulos'] },
                    { label: 'Referencias', icon: 'pi pi-fw pi-hashtag', routerLink: ['/app/referencias'] }
                ]
            }
        );

        // CRM & Terceros (Condicional para Empresas)
        const crmItems = [{ label: 'Terceros', icon: 'pi pi-fw pi-users', routerLink: ['/app/terceros'] }];
        if (!hasVendedorRole || hasAdminRole) {
            crmItems.push({ label: 'Empresas', icon: 'pi pi-fw pi-building', routerLink: ['/app/empresas'] });
        }
        crmItems.push({ label: 'Contactos', icon: 'pi pi-fw pi-address-book', routerLink: ['/app/contactos'] }, { label: 'Direcciones', icon: 'pi pi-fw pi-map-marker', routerLink: ['/app/direcciones'] });

        this.model.push({
            label: 'CRM & Terceros',
            items: crmItems
        });

        // Configuración & Logística (Condicional para TRM)
        const configItems = [
            { label: 'Transportadoras', icon: 'pi pi-fw pi-truck', routerLink: ['/app/transportadoras'] },
            { label: 'Categorías (ERP)', icon: 'pi pi-fw pi-tags', routerLink: ['/app/categorias'] }
        ];
        if (!hasVendedorRole || hasAdminRole) {
            configItems.push({ label: 'Tasa de Cambio (TRM)', icon: 'pi pi-fw pi-dollar', routerLink: ['/app/trms'] });
        }

        this.model.push({
            label: 'Configuración & Logística',
            items: configItems
        });

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
