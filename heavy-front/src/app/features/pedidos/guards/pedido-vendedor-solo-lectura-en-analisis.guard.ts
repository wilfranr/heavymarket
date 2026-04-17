import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';

/**
 * Bloquea la ruta de edición para vendedores cuando el pedido está en análisis.
 * El estado se obtiene del API antes de instanciar el componente (evita depender del store).
 */
export const pedidoVendedorSoloLecturaEnAnalisisGuard: CanActivateFn = (route) => {
    const authService = inject(AuthService);
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

    if (!authService.hasRole('Vendedor')) {
        return true;
    }
    if (authService.hasAnyRole(['Administrador', 'super_admin', 'Logistica', 'Analista'])) {
        return true;
    }

    return pedidoService.getById(id).pipe(
        map((res) => {
            const pedido = res.data;
            if (!pedido) return true;

            // Bloqueo universal para pedidos cancelados
            if (pedido.estado === 'Cancelado') {
                messageService.add({
                    severity: 'warn',
                    summary: 'Acceso Denegado',
                    detail: 'No se puede editar un pedido que ha sido cancelado.'
                });
                return router.createUrlTree(['/app/pedidos', id]);
            }

            // Bloqueo específico para vendedores en análisis
            if (pedido.estado === 'En_Analisis' && authService.hasRole('Vendedor') && !authService.hasAnyRole(['Administrador', 'super_admin', 'Logistica', 'Analista'])) {
                messageService.add({
                    severity: 'info',
                    summary: 'Solo lectura',
                    detail: 'Un pedido en análisis no puede editarse. Consulte el detalle del pedido.'
                });
                return router.createUrlTree(['/app/pedidos', id]);
            }
            return true;
        }),
        catchError(() => of(true))
    );
};
