import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { InfoCardMode, SelectOption } from '../maquina-info-card/maquina-info-card.component';
import { Tercero, Contacto } from '../../../core/models/tercero.model';

/**
 * Tarjeta informativa del cliente/tercero, compartida por las vistas de edición,
 * costeo, análisis, detalle y portal proveedor.
 *
 * - Modo `edit`: muestra los selects de cliente y contacto (los únicos campos
 *   modificables desde `pedidos/edit`) + acciones (editar, correo, WhatsApp).
 * - Modo `view`: muestra únicamente los valores como labels; el contacto del
 *   pedido se muestra como texto.
 */
@Component({
    selector: 'app-tercero-info-card',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, SelectModule, TooltipModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { class: 'flex flex-1 min-w-0' },
    templateUrl: './tercero-info-card.component.html',
    styleUrl: './tercero-info-card.component.scss'
})
export class TerceroInfoCardComponent {
    mode = input<InfoCardMode>('view');
    tercero = input<Tercero | null>(null);
    /** Contacto asociado al pedido (solo visible en modo view). */
    contacto = input<Contacto | null>(null);

    // Solo modo edit
    terceroControl = input<FormControl<number | null> | null>(null);
    tercerosOptions = input<SelectOption[]>([]);
    contactoControl = input<FormControl<number | null> | null>(null);
    contactosOptions = input<SelectOption[]>([]);
    emailCliente = input<string | undefined>(undefined);
    telefonoWhatsApp = input<string | undefined>(undefined);

    editCliente = output();
    sendEmail = output();
    sendWhatsApp = output();
    createContacto = output();

    /** Documento unificado: tipo + número (ej. "NIT 1234567 - 6", "CC 123456"). */
    protected readonly documento = computed(() => {
        const t = this.tercero();
        if (!t) return '---';
        const tipo = t.tipo_documento ? `${t.tipo_documento} ` : '';
        const numero = t.numero_documento || '';
        return (tipo + numero).trim() || '---';
    });
}
