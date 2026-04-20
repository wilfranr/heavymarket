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

import { Pedido, PedidoReferencia } from '../../../core/models/pedido.model';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';
import { selectPedidoById, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';
import { loadPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { AuthService } from '../../../core/auth/services/auth.service';

/** Entrada de historial de comentario de ítem (JSON en API o texto legacy). */
export interface ComentarioReferenciaVista {
    origen: string;
    comentario: string;
    fecha?: string;
}

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
    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;
    readonly pedidoEstadoTagClass = pedidoEstadoTagClass;

    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly authService = inject(AuthService);

    pedido$!: Observable<Pedido | undefined>;
    loading$!: Observable<boolean>;

    pedidoId = signal<number>(0);

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');

            if (id) {
                const pedidoId = parseInt(id, 10);
                this.pedidoId.set(pedidoId);

                this.pedido$ = this.store.select(selectPedidoById(pedidoId));
                this.loading$ = this.store.select(selectPedidosLoading);

                // Cargar pedido si no está en store o para actualizar
                this.store.dispatch(loadPedido({ id: pedidoId }));
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'ID de pedido inválido'
                });
                this.router.navigate(['/app/pedidos']);
            }
        });
    }

    /**
     * Vendedor: pedidos en análisis son solo lectura (edición la llevan analistas/admin).
     * Analista: siempre debe usar su vista de análisis, no la de edición.
     */
    puedeEditarPedido(pedido: Pedido): boolean {
        // Pedido cancelado no se puede editar nunca
        if (pedido.estado === 'Cancelado') {
            return false;
        }

        // Si es analista puro, no debe editar (debe analizar)
        if (this.authService.hasRole('Analista') && !this.authService.hasAnyRole(['Administrador', 'super_admin'])) {
            return false;
        }

        if (pedido.estado !== 'En_Analisis') {
            return true;
        }

        if (!this.authService.hasRole('Vendedor')) {
            return true;
        }

        return this.authService.hasAnyRole(['Administrador', 'super_admin', 'Logistica']);
    }

    /**
     * Determina si el usuario puede ver el botón de analizar (Analistas o Admins)
     */
    puedeAnalizarPedido(pedido: Pedido): boolean {
        if (pedido.estado === 'Cancelado') return false;
        return this.authService.hasAnyRole(['Analista', 'Administrador', 'super_admin']);
    }

    /**
     * Navega a la página de edición
     */
    editarPedido(): void {
        this.router.navigate(['/app/pedidos', this.pedidoId(), 'edit']);
    }

    /**
     * Navega a la página de análisis
     */
    analizarPedido(): void {
        this.router.navigate(['/app/pedidos', this.pedidoId(), 'analysis']);
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

    /** Comentarios de un ítem requerido para vista (parsea JSON o texto plano). */
    comentariosDeItem(item: PedidoReferencia): ComentarioReferenciaVista[] {
        return this.parseComentariosRaw(item?.comentario);
    }

    /** Notas generales del pedido (mismo formato que comentarios por ítem). */
    comentariosDelPedido(pedido: Pedido): ComentarioReferenciaVista[] {
        return this.parseComentariosRaw(pedido?.comentario);
    }

    private parseComentariosRaw(raw: unknown): ComentarioReferenciaVista[] {
        if (!raw) {
            return [];
        }

        // Si ya es un array (nuevo formato del API con casts)
        if (Array.isArray(raw)) {
            return raw
                .filter((c): c is { comentario?: string; origen?: string; fecha?: string } => !!c && typeof c === 'object')
                .filter((c) => typeof c.comentario === 'string')
                .map((c) => ({
                    origen: typeof c.origen === 'string' ? c.origen : 'Interno',
                    comentario: c.comentario as string,
                    fecha: typeof c.fecha === 'string' ? c.fecha : undefined
                }));
        }

        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (!trimmed || trimmed === 'Sin comentario adicional') {
                return [];
            }

            try {
                const parsed = JSON.parse(trimmed) as unknown;
                if (Array.isArray(parsed)) {
                    return parsed
                        .filter((c): c is { comentario?: string; origen?: string; fecha?: string } => !!c && typeof c === 'object')
                        .filter((c) => typeof c.comentario === 'string')
                        .map((c) => ({
                            origen: typeof c.origen === 'string' ? c.origen : 'Interno',
                            comentario: c.comentario as string,
                            fecha: typeof c.fecha === 'string' ? c.fecha : undefined
                        }));
                }
            } catch {
                // No es JSON: formato legacy
            }

            const sinPrefijo = trimmed.startsWith('Comentario del cliente:')
                ? trimmed.replace('Comentario del cliente:', '').trim()
                : trimmed;

            if (!sinPrefijo) {
                return [];
            }

            return [{ origen: 'Cliente', comentario: sinPrefijo }];
        }

        return [];
    }
}
