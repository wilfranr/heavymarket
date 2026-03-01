import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { DashboardService, BestSellingProduct } from '../../../core/services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-best-selling-widget',
    imports: [CommonModule, ButtonModule, MenuModule],
    template: ` <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">Productos Más Vendidos</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>
        <ul class="list-none p-0 m-0">
            @for (product of products(); track product.codigo; let i = $index) {
                <li class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <div>
                        <span class="text-surface-900 dark:text-surface-0 font-medium mr-2 mb-1 md:mb-0">{{ product.nombre }}</span>
                        <div class="mt-1 text-muted-color">Código: {{ product.codigo }}</div>
                    </div>
                    <div class="mt-2 md:mt-0 flex items-center">
                        <div class="bg-surface-300 dark:bg-surface-500 rounded-border overflow-hidden w-40 lg:w-24" style="height: 8px">
                            <div [class]="'h-full bg-' + getColor(i) + '-500'" [style.width]="calculateWidth(product.total_quantity)"></div>
                        </div>
                        <span [class]="'text-' + getColor(i) + '-500 ml-4 font-medium'">{{ product.total_quantity }}</span>
                    </div>
                </li>
            }
            @if (products().length === 0) {
                <div class="text-center text-muted-color py-4">No hay datos disponibles</div>
            }
        </ul>
    </div>`
})
export class BestSellingWidget implements OnInit {
    private readonly dashboardService = inject(DashboardService);

    products = signal<BestSellingProduct[]>([]);

    menu = null;

    items = [
        { label: 'Agregar Nuevo', icon: 'pi pi-fw pi-plus' },
        { label: 'Eliminar', icon: 'pi pi-fw pi-trash' }
    ];

    ngOnInit(): void {
        this.dashboardService.getBestSelling().subscribe((data) => {
            this.products.set(data);
        });
    }

    calculateWidth(value: number): string {
        // Find max value to normalize or just use a percentage if backend gives it.
        // Backend gives quantities or total_value. Let's assume max is relative to something or just random for now.
        // Actually, backend gives total_value and total_quantity.
        // Let's use a simple heuristic for width.
        return Math.min(value, 100) + '%';
    }

    // Helper to get color based on index or value
    getColor(index: number): string {
        const colors = ['orange', 'cyan', 'pink', 'green', 'purple', 'teal'];
        return colors[index % colors.length];
    }
}
