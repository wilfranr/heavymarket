import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';
import { DataViewModule } from 'primeng/dataview';
import { PanelModule } from 'primeng/panel';

import { Pedido } from '../../../core/models/pedido.model';
import { selectPedidoById, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';

/**
 * Componente de detalle de pedido
 * Muestra información completa de un pedido específico
 */
@Component({
    selector: 'app-pedido-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule, SkeletonModule, ToastModule, TabsModule, DataViewModule, PanelModule],
    providers: [MessageService],
    templateUrl: './detail.html',
    styleUrl: './detail.scss'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    pedido$!: Observable<Pedido | undefined>;
    loading$!: Observable<boolean>;

    pedidoId = signal<number>(0);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');

        if (id) {
            const pedidoId = parseInt(id, 10);
            this.pedidoId.set(pedidoId);

            this.pedido$ = this.store.select(selectPedidoById(pedidoId));
            this.loading$ = this.store.select(selectPedidosLoading);
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'ID de pedido inválido'
            });
            this.router.navigate(['/app/pedidos']);
        }
    }

    /**
     * Obtiene el color del tag según el estado del pedido
     */
    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        const severityMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
            pendiente: 'warn',
            en_proceso: 'info',
            completado: 'success',
            cancelado: 'danger',
            entregado: 'success'
        };
        return severityMap[estado] || 'secondary';
    }

    /**
     * Navega a la página de edición
     */
    editarPedido(): void {
        this.router.navigate(['/app/pedidos', this.pedidoId(), 'edit']);
    }

    /**
     * Vuelve a la lista de pedidos
     */
    volver(): void {
        this.router.navigate(['/app/pedidos']);
    }

    /**
     * Imprime el pedido
     */
    imprimirPedido(): void {
        window.print();
    }
}
