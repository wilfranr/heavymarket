import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProviderPortalService } from '../services/provider-portal.service';

export type CostingOpportunityStatus = 'pending' | 'sent' | 'approved';

interface OportunidadCosteoRaw {
    pedido_id?: number;
    pedido?: {
        id?: number;
        estado?: string;
        user?: { name?: string } | null;
        maquina?: { marca?: string | null; modelo?: string | null } | null;
    } | null;
}

export interface OportunidadCosteoPedidoResumen {
    pedidoId: number;
    estadoPedido: string;
    cliente: string;
    maquina: string;
    cantidadItems: number;
}

/**
 * Agrupa las filas planas de oportunidades de costeo (una por referencia) en un
 * resumen por pedido, para mostrar una tabla de acceso en vez de un selector plano.
 */
export function agruparOportunidadesPorPedido(filas: OportunidadCosteoRaw[]): OportunidadCosteoPedidoResumen[] {
    const resumenes = new Map<number, OportunidadCosteoPedidoResumen>();

    for (const fila of filas) {
        const pedidoId = fila.pedido_id ?? fila.pedido?.id;
        if (!pedidoId) {
            continue;
        }

        const existente = resumenes.get(pedidoId);
        if (existente) {
            existente.cantidadItems += 1;
            continue;
        }

        const maquina = fila.pedido?.maquina;
        const maquinaLabel = maquina ? [maquina.marca, maquina.modelo].filter(Boolean).join(' ') || 'Sin máquina asociada' : 'Sin máquina asociada';

        resumenes.set(pedidoId, {
            pedidoId,
            estadoPedido: fila.pedido?.estado ?? 'N/A',
            cliente: fila.pedido?.user?.name ?? 'N/A',
            maquina: maquinaLabel,
            cantidadItems: 1
        });
    }

    return Array.from(resumenes.values()).sort((a, b) => b.pedidoId - a.pedidoId);
}

@Component({
    selector: 'app-costing-opportunities-list',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, ButtonModule, SelectModule, TagModule, ToastModule],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2 class="m-0"><i class="pi pi-calculator text-blue-600 mr-2"></i>Oportunidades de Costeo</h2>
                <div class="flex items-center gap-3">
                    <p-select [options]="estadoOptions" [ngModel]="activeStatus()" (ngModelChange)="onStatusChange($event)" optionLabel="label" optionValue="value" styleClass="min-w-[200px]"></p-select>
                    <p-button icon="pi pi-refresh" [loading]="loading()" (onClick)="loadResumenes()" [outlined]="true" label="Actualizar"></p-button>
                </div>
            </div>

            <p-table [value]="resumenes()" [loading]="loading()" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Pedido #</th>
                        <th>Cliente</th>
                        <th>Máquina</th>
                        <th class="text-center">Ítems</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-resumen>
                    <tr>
                        <td class="font-bold">PED-{{ resumen.pedidoId }}</td>
                        <td>{{ resumen.cliente }}</td>
                        <td>{{ resumen.maquina }}</td>
                        <td class="text-center">
                            <p-tag [value]="resumen.cantidadItems" severity="info"></p-tag>
                        </td>
                        <td class="text-center">
                            <p-button icon="pi pi-calculator" label="Costear" severity="secondary" [outlined]="true" (onClick)="irACosteo(resumen)"></p-button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5" class="text-center py-6 text-slate-500 dark:text-slate-400">No hay oportunidades de costeo en este estado.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `,
    styles: []
})
export class CostingOpportunitiesListComponent implements OnInit {
    private readonly providerPortalService = inject(ProviderPortalService);
    private readonly messageService = inject(MessageService);
    private readonly router = inject(Router);

    loading = signal(false);
    activeStatus = signal<CostingOpportunityStatus>('pending');
    resumenes = signal<OportunidadCosteoPedidoResumen[]>([]);

    estadoOptions: { label: string; value: CostingOpportunityStatus }[] = [
        { label: 'Pendientes', value: 'pending' },
        { label: 'Enviados', value: 'sent' },
        { label: 'Aprobados', value: 'approved' }
    ];

    ngOnInit(): void {
        this.loadResumenes();
    }

    loadResumenes(): void {
        this.loading.set(true);
        this.providerPortalService.getOpportunities({ status: this.activeStatus() }).subscribe({
            next: (response: { data?: OportunidadCosteoRaw[] }) => {
                this.resumenes.set(agruparOportunidadesPorPedido(response.data || []));
                this.loading.set(false);
            },
            error: (error: { error?: { message?: string } }) => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'No se pudieron cargar las oportunidades de costeo.'
                });
            }
        });
    }

    onStatusChange(status: CostingOpportunityStatus | null): void {
        if (status) {
            this.activeStatus.set(status);
            this.loadResumenes();
        }
    }

    irACosteo(resumen: OportunidadCosteoPedidoResumen): void {
        this.router.navigate(['/provider/opportunities', resumen.pedidoId], { queryParams: { status: this.activeStatus() } });
    }
}
