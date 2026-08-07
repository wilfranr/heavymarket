import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';

export type InfoCardMode = 'edit' | 'view';

/**
 * Tarjeta informativa de la máquina, compartida por las vistas de edición,
 * costeo, análisis, detalle y portal proveedor.
 *
 * - Modo `edit`: muestra el select de máquina + acciones (editar/ver detalle).
 *   Solo se usa en `pedidos/edit`, donde el campo es modificable.
 * - Modo `view`: muestra únicamente los valores como labels. El select se
 *   convierte en el campo "Máquina" de solo lectura.
 */
@Component({
    selector: 'app-maquina-info-card',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './maquina-info-card.component.html',
    styleUrl: './maquina-info-card.component.scss'
})
export class MaquinaInfoCardComponent {
    mode = input<InfoCardMode>('view');
    maquina = input<any>(null);
    /** Muestra el botón de ver detalle también en modo view (p. ej. análisis). */
    showDetailButton = input(false);

    // Solo modo edit
    control = input<FormControl | null>(null);
    options = input<any[]>([]);

    editMaquina = output<any>();
    viewMaquina = output<any>();
}
