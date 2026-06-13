import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { PedidoService } from '../../../core/services/pedido.service';
import { pedidoEsSoloLectura } from '../../../core/utils/pedido-edicion-comercial';

/**
 * Protege la ruta /costeo: bloquea acceso desde Cotizado en adelante (solo lectura total).
 */
export const pedidoSoloLecturaCosteoGuard: CanActivateFn = (route) => {
    const router = inject(Router);
    const pedidoService = inject(PedidoService);
    const messageService = inject(MessageService);

    const idStr = route.paramMap.get('id');
    if (!idStr) {
        return true;
    }
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) {
        return true;
    }

    return pedidoService.getById(id).pipe(
        map((res) => {
            const pedido = res.data;
            if (!pedido) return true;

            if (pedidoEsSoloLectura(pedido.estado)) {
                messageService.add({
                    severity: 'info',
                    summary: 'Solo lectura',
                    detail: 'Este pedido no admite edicion de costeo. Consulte el detalle del pedido.'
                });
                return router.createUrlTree(['/app/pedidos', id]);
            }

            return true;
        }),
        catchError(() => of(true))
    );
};
