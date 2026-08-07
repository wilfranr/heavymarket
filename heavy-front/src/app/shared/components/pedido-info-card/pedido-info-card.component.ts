import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Pedido } from '../../../core/models/pedido.model';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';

/**
 * Tarjeta informativa del pedido, compartida por las vistas de edición,
 * costeo, análisis, detalle y portal proveedor.
 *
 * No tiene modo edición: es de solo lectura en todas las vistas.
 */
@Component({
    selector: 'app-pedido-info-card',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pedido-info-card.component.html',
    styleUrl: './pedido-info-card.component.scss'
})
export class PedidoInfoCardComponent {
    pedido = input<Pedido | null | undefined>(null);
    consecutivo = input<number | null>(null);
    estado = input<string | null>(null);
    comentariosCount = input(0);

    openComments = output();

    protected readonly consecutivoFinal = computed(() => this.consecutivo() ?? this.pedido()?.id ?? null);
    protected readonly estadoFinal = computed(() => this.estado() ?? this.pedido()?.estado ?? null);

    protected readonly etiquetaEstado = pedidoEstadoEtiqueta;
    protected readonly claseEstado = pedidoEstadoTagClass;
}
