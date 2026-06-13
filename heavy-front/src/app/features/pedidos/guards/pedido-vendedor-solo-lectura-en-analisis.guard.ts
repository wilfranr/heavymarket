import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { pedidoPermiteEdicionComercial } from '../../../core/utils/pedido-edicion-comercial';

/**
 * Protege la ruta /edit: bloquea edición comercial en estados restringidos (p. ej. En_Costeo)
 * y reglas por rol (vendedor en análisis, analista redirigido a /analysis).
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

    return pedidoService.getById(id).pipe(
        map((res) => {
            const pedido = res.data;
            if (!pedido) return true;

            if (!pedidoPermiteEdicionComercial(pedido.estado)) {
                const destino = pedido.estado === 'En_Costeo' ? ['costeo'] : [];
                messageService.add({
                    severity: 'info',
                    summary: pedido.estado === 'En_Costeo' ? 'Pedido en costeo' : 'Edición no permitida',
                    detail:
                        pedido.estado === 'En_Costeo'
                            ? 'Use la vista de costeo para gestionar precios y proveedores.'
                            : 'Este pedido no admite edición comercial.'
                });
                return router.createUrlTree(['/app/pedidos', id, ...destino]);
            }

            if (authService.hasAnyRole(['Administrador', 'super_admin', 'Logistica'])) {
                return true;
            }

            if (!authService.hasRole('Vendedor') && !authService.hasRole('Analista')) {
                return true;
            }

            if (authService.hasRole('Analista') && !authService.hasAnyRole(['Administrador', 'super_admin'])) {
                return router.createUrlTree(['/app/pedidos', id, 'analysis']);
            }

            if (pedido.estado === 'En_Analisis' && authService.hasRole('Vendedor')) {
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
