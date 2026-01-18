import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectPedidosTotal } from '../../../store/pedidos/selectors/pedidos.selectors';
import { selectTercerosTotal } from '../../../store/terceros/selectors/terceros.selectors';
import { loadPedidos } from '../../../store/pedidos/actions/pedidos.actions';
import { loadTerceros } from '../../../store/terceros/actions/terceros.actions';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Pedidos</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalPedidos$ | async }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-shopping-cart text-blue-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">Total de pedidos</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Cotizaciones</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">0</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-file text-orange-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">Total de cotizaciones</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Terceros</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ totalTerceros$ | async }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-cyan-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">Clientes y proveedores</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Órdenes</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">0</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-shopping-bag text-purple-500 text-xl!"></i>
                    </div>
                </div>
                <span class="text-muted-color">Órdenes de compra</span>
            </div>
        </div>`
})
export class StatsWidget implements OnInit {
    private readonly store = inject(Store);

    totalPedidos$!: Observable<number>;
    totalTerceros$!: Observable<number>;

    ngOnInit(): void {
        this.store.dispatch(loadPedidos({}));
        this.store.dispatch(loadTerceros({}));

        this.totalPedidos$ = this.store.select(selectPedidosTotal);
        this.totalTerceros$ = this.store.select(selectTercerosTotal);
    }
}
