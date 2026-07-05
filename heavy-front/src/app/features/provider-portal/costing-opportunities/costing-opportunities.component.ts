import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { ProviderPortalService } from '../services/provider-portal.service';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';
import { ENTREGA_OPTIONS, EntregaValue, entregaPayload, entregaValueDesdePersistencia } from '../../../core/utils/entrega-plazo';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';
import { PedidoEstado } from '../../../core/models/pedido.model';

interface ProviderPedidoSummary {
    id: number;
    estado: PedidoEstado | string;
    created_at?: string;
    updated_at?: string;
    user?: { name?: string };
    maquina?: {
        tipo?: string;
        marca?: string;
        modelo?: string;
        serie?: string;
        id_interno?: string;
    };
}

interface ProviderCosteoRow {
    id: number;
    pedido_id?: number;
    cantidad: number;
    definicion?: string;
    peso?: number;
    referencia?: { referencia?: string; articulo?: { peso?: number } };
    pedido?: ProviderPedidoSummary | null;
    form_costo: number | null;
    form_entrega?: EntregaValue;
    form_marca_id?: number | null;
    form_comentario?: string;
    form_cantidad_cotizada: number;
    form_seleccionado: boolean;
    submitting: boolean;
    already_costed: boolean;
}

@Component({
    selector: 'app-costing-opportunities',
    standalone: true,
    imports: [CommonModule, ButtonModule, FormsModule, InputTextModule, InputNumberModule, ToastModule, SelectModule, CheckboxModule, SkeletonModule],
    providers: [MessageService],
    templateUrl: './costing-opportunities.component.html',
    styleUrl: '../../pedidos/edit/edit.scss'
})
export class CostingOpportunitiesComponent implements OnInit {
    private readonly providerPortalService = inject(ProviderPortalService);
    private readonly listaService = inject(ListaService);
    private readonly messageService = inject(MessageService);

    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;

    opportunities = signal<ProviderCosteoRow[]>([]);
    providerInfo = signal<{ id?: number; nombre?: string; is_national: boolean }>({ is_national: true });
    loading = signal(false);
    submitting = signal(false);
    activeStatus = signal<'pending' | 'sent' | 'approved'>('pending');
    activePedidoId = signal<number | null>(null);
    modoEdicion = signal(false);

    marcas: { label: string; value: number }[] = [];
    tiemposEntrega = ENTREGA_OPTIONS;
    estadoOptions = [
        { label: 'Pendientes', value: 'pending' as const },
        { label: 'Enviados', value: 'sent' as const },
        { label: 'Aprobados', value: 'approved' as const }
    ];

    pedidosDisponibles = computed(() => {
        const pedidos = new Map<number, string>();
        for (const row of this.opportunities()) {
            const pedidoId = row.pedido_id ?? row.pedido?.id;
            if (pedidoId) {
                pedidos.set(pedidoId, `Pedido #${pedidoId}`);
            }
        }
        return Array.from(pedidos.entries()).map(([value, label]) => ({ value, label }));
    });

    pedidoActivo = computed<ProviderPedidoSummary | null>(() => {
        const pedidoId = this.activePedidoId();
        if (!pedidoId) {
            return null;
        }
        const row = this.opportunities().find((item) => (item.pedido_id ?? item.pedido?.id) === pedidoId);
        return row?.pedido ?? null;
    });

    filasPedidoActivo = computed(() => {
        const pedidoId = this.activePedidoId();
        if (!pedidoId) {
            return [];
        }
        return this.opportunities().filter((item) => (item.pedido_id ?? item.pedido?.id) === pedidoId);
    });

    ngOnInit(): void {
        this.loadOpportunities();
        this.loadMarcas();
    }

    loadOpportunities(): void {
        this.loading.set(true);
        this.providerPortalService.getOpportunities({ status: this.activeStatus() }).subscribe({
            next: (response: { data?: ProviderCosteoRow[]; provider?: { id?: number; nombre?: string; is_national: boolean } }) => {
                const items = (response.data || []).map((item) => this.normalizarFila(item));
                this.opportunities.set(items);

                if (response.provider) {
                    this.providerInfo.set(response.provider);
                }

                const pedidoIds = items
                    .map((item) => item.pedido_id ?? item.pedido?.id)
                    .filter((id): id is number => typeof id === 'number');

                if (pedidoIds.length === 0) {
                    this.activePedidoId.set(null);
                } else if (!this.activePedidoId() || !pedidoIds.includes(this.activePedidoId()!)) {
                    this.activePedidoId.set(pedidoIds[0]);
                }

                this.modoEdicion.set(false);
                this.loading.set(false);
            },
            error: (error) => {
                const errorMsg = error.error?.message || 'No se pudieron cargar las oportunidades.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                this.loading.set(false);
            }
        });
    }

    private normalizarFila(item: ProviderCosteoRow): ProviderCosteoRow {
        const peso = item.peso ?? item.referencia?.articulo?.peso ?? 0;

        return {
            ...item,
            pedido_id: item.pedido_id ?? item.pedido?.id,
            peso,
            form_costo: item.form_costo ?? null,
            form_entrega: entregaValueDesdePersistencia((item as { form_dias_entrega?: number | null }).form_dias_entrega, (item as { form_es_backorder?: boolean }).form_es_backorder),
            form_marca_id: item.form_marca_id ?? null,
            form_comentario: item.form_comentario || '',
            form_cantidad_cotizada: item.form_cantidad_cotizada ?? item.cantidad ?? 1,
            form_seleccionado: item.form_seleccionado ?? true,
            submitting: false,
            already_costed: item.already_costed || false
        };
    }

    private loadMarcas(): void {
        this.listaService.getByTipo('Fabricantes').subscribe({
            next: (marcas: Lista[]) => {
                this.marcas = marcas.map((m: Lista) => ({ label: m.nombre, value: m.id }));
            }
        });
    }

    onStatusChange(status: 'pending' | 'sent' | 'approved' | null): void {
        if (status) {
            this.activeStatus.set(status);
            this.loadOpportunities();
        }
    }

    onPedidoChange(pedidoId: number | null): void {
        this.activePedidoId.set(pedidoId);
    }

    getEstadoClase(estado: string): string {
        return pedidoEstadoTagClass(estado);
    }

    filaEditable(ref: ProviderCosteoRow): boolean {
        if (this.activeStatus() !== 'pending') {
            return this.modoEdicion() && !ref.already_costed;
        }
        return !ref.already_costed;
    }

    hayFilasEditables(): boolean {
        return this.filasPedidoActivo().some((row) => this.filaEditable(row));
    }

    toggleModoEdicion(): void {
        this.modoEdicion.update((value) => !value);
    }

    calcularCostoTotal(ref: ProviderCosteoRow): number {
        const cantidad = Number(ref.form_cantidad_cotizada) || 0;
        const costo = Number(ref.form_costo) || 0;
        return cantidad * costo;
    }

    formatearCostoTotal(ref: ProviderCosteoRow): string {
        return this.formatearMoneda(this.calcularCostoTotal(ref));
    }

    private filasSeleccionadas(): ProviderCosteoRow[] {
        return this.filasPedidoActivo().filter((row) => row.form_seleccionado);
    }

    calcularSubtotal(): number {
        return this.filasSeleccionadas().reduce((total, row) => total + this.calcularCostoTotal(row), 0);
    }

    calcularImpuestos(): number {
        if (this.providerInfo().is_national) {
            return this.calcularSubtotal() * 0.19;
        }
        return 0;
    }

    calcularFletes(): number {
        return 0;
    }

    calcularTotal(): number {
        return this.calcularSubtotal() + this.calcularImpuestos() + this.calcularFletes();
    }

    formatearMoneda(valor: number): string {
        const moneda = this.providerInfo().is_national ? 'COP' : 'USD';
        const locale = this.providerInfo().is_national ? 'es-CO' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(valor || 0);
    }

    guardarSeleccion(): void {
        const filas = this.filasSeleccionadas().filter((row) => this.filaEditable(row) && this.filaValida(row));
        if (filas.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin cambios',
                detail: 'Seleccione al menos una fila válida para guardar.'
            });
            return;
        }
        this.enviarFilas(filas, 'Oferta guardada correctamente.');
    }

    finalizarCosteo(): void {
        const filas = this.filasSeleccionadas().filter((row) => this.filaEditable(row) && this.filaValida(row));
        if (filas.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe seleccionar al menos una fila con costo, marca y entrega completos.'
            });
            return;
        }
        this.enviarFilas(filas, 'Costeo finalizado correctamente.');
    }

    private filaValida(ref: ProviderCosteoRow): boolean {
        return !!ref.form_costo && ref.form_entrega !== undefined && !!ref.form_cantidad_cotizada;
    }

    private enviarFilas(filas: ProviderCosteoRow[], successMessage: string): void {
        this.submitting.set(true);
        let completadas = 0;
        let errores = 0;

        filas.forEach((ref) => {
            ref.submitting = true;
            const entrega = entregaPayload(ref.form_entrega as EntregaValue);
            const payload = {
                pedido_referencia_id: ref.id,
                costo_unidad: ref.form_costo as number,
                ...entrega,
                marca_id: ref.form_marca_id ?? undefined,
                comentario: ref.form_comentario
            };

            this.providerPortalService.submitCost(payload).subscribe({
                next: () => {
                    ref.submitting = false;
                    completadas += 1;
                    this.opportunities.update((rows) => rows.filter((row) => row.id !== ref.id));
                    this.finalizarEnvio(filas.length, completadas, errores, successMessage);
                },
                error: (error: { error?: { message?: string } }) => {
                    ref.submitting = false;
                    errores += 1;
                    const errorMsg = error.error?.message || 'Error al enviar la oferta.';
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                    this.finalizarEnvio(filas.length, completadas, errores, successMessage);
                }
            });
        });
    }

    private finalizarEnvio(total: number, completadas: number, errores: number, successMessage: string): void {
        if (completadas + errores < total) {
            return;
        }

        this.submitting.set(false);

        if (completadas > 0 && errores === 0) {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: successMessage });
        }

        if (this.opportunities().length === 0) {
            this.activePedidoId.set(null);
            this.loadOpportunities();
            return;
        }

        const pedidoIds = this.opportunities()
            .map((item) => item.pedido_id ?? item.pedido?.id)
            .filter((id): id is number => typeof id === 'number');

        if (this.activePedidoId() && !pedidoIds.includes(this.activePedidoId()!)) {
            this.activePedidoId.set(pedidoIds[0] ?? null);
        }
    }
}
