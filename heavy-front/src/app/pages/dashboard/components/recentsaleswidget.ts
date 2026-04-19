import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../../core/models/pedido.model';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';
import { selectAllPedidos } from '../../../store/pedidos/selectors/pedidos.selectors';
import { loadPedidos } from '../../../store/pedidos/actions/pedidos.actions';

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, TagModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">Pedidos Recientes</div>
        <p-table [value]="(recentPedidos$ | async) || []" [paginator]="true" [rows]="5" responsiveLayout="scroll">
            <ng-template pTemplate="header">
                <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-pedido>
                <tr (click)="verDetalle(pedido.id)" class="cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                    <td>#{{ pedido.id }}</td>
                    <td>{{ pedido.tercero?.nombre || 'Sin cliente' }}</td>
                    <td>
                        <p-tag [value]="pedidoEstadoEtiqueta(pedido.estado)" [styleClass]="pedidoEstadoTagClass(pedido.estado)" [rounded]="true"></p-tag>
                    </td>
                    <td>{{ pedido.created_at | date: 'dd/MM/yyyy' }}</td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class RecentSalesWidget implements OnInit {
    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;
    readonly pedidoEstadoTagClass = pedidoEstadoTagClass;

    private readonly store = inject(Store);
    private readonly router = inject(Router);

    recentPedidos$!: Observable<Pedido[]>;

    ngOnInit(): void {
        this.store.dispatch(loadPedidos({ params: { per_page: 10, sort: '-created_at' } }));
        this.recentPedidos$ = this.store.select(selectAllPedidos).pipe(map((pedidos) => (pedidos || []).slice(0, 5)));
    }

    verDetalle(id: number): void {
        this.router.navigate(['/app/pedidos', id]);
    }

}
