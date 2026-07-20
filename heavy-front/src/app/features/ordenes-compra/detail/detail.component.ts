import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { loadOrdenCompraById, transitionOrdenCompra } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { OrdenCompra, OrdenCompraEstado } from '../../../core/models/orden-compra.model';

const ORDEN_COMPRA_TRANSICIONES: Record<OrdenCompraEstado, OrdenCompraEstado[]> = {
    'Pendiente de envío': ['Enviada', 'Cancelada'],
    Enviada: ['Confirmada', 'Cancelada'],
    Confirmada: ['Recibida parcialmente', 'Recibida', 'Cancelada'],
    'Recibida parcialmente': ['Recibida', 'Cerrada'],
    Recibida: ['Cerrada'],
    Cerrada: [],
    Cancelada: []
};

export function ordenCompraPuedeTransitar(origen: OrdenCompraEstado | null, destino: OrdenCompraEstado): boolean {
    return origen ? ORDEN_COMPRA_TRANSICIONES[origen].includes(destino) : false;
}

export function ordenCompraPuedeRecibir(estado: OrdenCompraEstado | null): boolean {
    return false;
}

export function ordenCompraPuedeCancelar(estado: OrdenCompraEstado | null): boolean {
    return estado === 'Pendiente de envío' || estado === 'Enviada' || estado === 'Confirmada';
}

/**
 * Componente de detalle de orden de compra
 */
@Component({
    selector: 'app-orden-compra-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule, TableModule, TooltipModule, DialogModule, TextareaModule, InputTextModule],
    template: `
        <div class="card">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 class="m-0">Orden de Compra OC-{{ ordenCompraId() }}</h2>
                    <p class="text-gray-500 m-0">Detalle completo y referencias vinculadas</p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [text]="true" (onClick)="onBack()"></p-button>
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" (onClick)="onEdit()"></p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    <p class="mt-4">Cargando información...</p>
                </div>
            } @else if (ordenCompra()) {
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Columna Izquierda: Info Principal -->
                    <div class="lg:col-span-2 flex flex-col gap-6">
                        <p-card header="Información General">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Proveedor</span>
                                    <span class="text-lg">{{ ordenCompra()?.proveedor?.nombre || 'N/A' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Estado</span>
                                    <div class="mt-1">
                                        <p-tag [value]="ordenCompra()?.estado || 'N/A'" [severity]="getEstadoSeverity(ordenCompra()?.estado || '')"></p-tag>
                                    </div>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Fecha Expedición</span>
                                    <span>{{ ordenCompra()?.fecha_expedicion | date: 'longDate' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Fecha Entrega</span>
                                    <span>{{ ordenCompra()?.fecha_entrega | date: 'longDate' }}</span>
                                </div>
                                <div class="flex flex-col md:col-span-2">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Observaciones</span>
                                    <p class="mt-1 m-0 text-gray-300 italic">{{ ordenCompra()?.observaciones || 'Sin observaciones' }}</p>
                                </div>
                            </div>
                        </p-card>

                        <p-card header="Acciones de estado">
                            <div class="flex flex-wrap gap-2">
                                @if (puedePasarA('Enviada')) {
                                    <p-button label="Enviar al proveedor" icon="pi pi-send" (onClick)="transitionTo('Enviada')"></p-button>
                                }
                                @if (puedePasarA('Confirmada')) {
                                    <p-button label="Confirmar" icon="pi pi-thumbs-up" severity="success" (onClick)="transitionTo('Confirmada')"></p-button>
                                }
                                @if (puedePasarA('Cerrada')) {
                                    <p-button label="Cerrar" icon="pi pi-lock" severity="secondary" (onClick)="transitionTo('Cerrada')"></p-button>
                                }
                                @if (puedeCancelar()) {
                                    <p-button label="Cancelar" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="openCancelDialog()"></p-button>
                                }
                            </div>
                        </p-card>

                        <p-card header="Referencias vinculadas">
                            <p-table [value]="ordenCompra()?.detalles || ordenCompra()?.referencias || []" styleClass="p-datatable-sm">
                                <ng-template pTemplate="header">
                                    <tr>
                                        <th>Referencia</th>
                                        <th class="text-center">Cant.</th>
                                        <th class="text-center">Recibida</th>
                                        <th class="text-right">V. Unitario</th>
                                        <th class="text-right">Total</th>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-item>
                                    <tr>
                                        <td>
                                            <div class="flex flex-col">
                                                <span class="font-bold">{{ item.referencia?.codigo_heavymarket }}</span>
                                                <span class="text-xs text-gray-400">{{ item.referencia?.descripcion }}</span>
                                            </div>
                                        </td>
                                        <td class="text-center">{{ item.cantidad }}</td>
                                        <td class="text-center">{{ item.cantidad_recibida ?? 0 }}</td>
                                        <td class="text-right">{{ item.valor_unitario | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                        <td class="text-right font-bold">{{ item.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="footer">
                                    <tr>
                                        <td colspan="4" class="text-right font-bold text-lg">Total Orden:</td>
                                        <td class="text-right text-lg font-bold text-primary">{{ ordenCompra()?.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </p-card>
                    </div>

                    <!-- Columna Derecha: Info Entrega / Vínculos -->
                    <div class="flex flex-col gap-6">
                        <p-card header="Logística y Entrega">
                            <div class="flex flex-col gap-4">
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-map-marker text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">DIRECCIÓN</span>
                                        <span>{{ ordenCompra()?.direccion || 'No especificada' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-phone text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">TELÉFONO</span>
                                        <span>{{ ordenCompra()?.telefono || 'N/A' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-truck text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">GUÍA DE TRANSPORTE</span>
                                        <span class="font-mono">{{ ordenCompra()?.guia || 'Pendiente' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-calendar-clock text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">FECHAS DE CICLO</span>
                                        <span class="text-sm">Envío: {{ (ordenCompra()?.fecha_envio | date: 'short') || 'Pendiente' }}</span>
                                        <span class="text-sm">Confirmación: {{ (ordenCompra()?.fecha_confirmacion | date: 'short') || 'Pendiente' }}</span>
                                        <span class="text-sm">Recepción: {{ (ordenCompra()?.fecha_recepcion | date: 'short') || 'Pendiente' }}</span>
                                    </div>
                                </div>
                            </div>
                        </p-card>

                        <p-card header="Documentos Relacionados">
                            <div class="flex flex-col gap-3">
                                @if (ordenCompra()?.pedido_id) {
                                    <p-button [label]="'Pedido #' + ordenCompra()?.pedido_id" icon="pi pi-external-link" [text]="true" size="small" styleClass="p-0"></p-button>
                                }
                                @if (ordenCompra()?.cotizacion_id) {
                                    <p-button [label]="'Cotización #' + ordenCompra()?.cotizacion_id" icon="pi pi-external-link" [text]="true" size="small" styleClass="p-0"></p-button>
                                }
                                @if (!ordenCompra()?.pedido_id && !ordenCompra()?.cotizacion_id) {
                                    <p class="text-gray-500 text-sm italic">Sin documentos vinculados</p>
                                }
                            </div>
                        </p-card>
                    </div>
                </div>
            } @else {
                <div class="text-center py-12">
                    <i class="pi pi-exclamation-circle text-6xl text-gray-700 mb-4"></i>
                    <p class="text-xl text-gray-500">No se encontró la orden de compra solicitada</p>
                    <p-button label="Volver a la lista" icon="pi pi-arrow-left" (onClick)="onBack()" styleClass="mt-4"></p-button>
                </div>
            }
        </div>

        <p-dialog [visible]="cancelDialogVisible()" (visibleChange)="cancelDialogVisible.set($event)" header="Cancelar orden de compra" [modal]="true" [style]="{ width: '32rem' }">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <div class="field">
                    <label for="motivo_cancelacion" class="block text-sm font-medium mb-2">Motivo de cancelación <span class="text-red-500">*</span></label>
                    <textarea pTextarea id="motivo_cancelacion" [ngModel]="motivoCancelacion()" (ngModelChange)="motivoCancelacion.set($event)" rows="4" class="w-full" placeholder="Explique por qué se cancela la orden"></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Volver" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="cancelDialogVisible.set(false)" />
                    <p-button label="Confirmar cancelación" icon="pi pi-check" severity="danger" [disabled]="!motivoCancelacion().trim()" (onClick)="confirmCancel()" />
                </div>
            </ng-template>
        </p-dialog>

    `,
    styles: []
})
export class DetailComponent implements OnInit, OnDestroy {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly destroy$ = new Subject<void>();

    ordenCompraId = signal<number>(0);
    loading = toSignal(this.store.select(OrdenesCompraSelectors.selectOrdenesCompraLoading), { initialValue: true });

    // Select from store using a computed or derived signal
    ordenCompra = signal<OrdenCompra | null>(null);
    cancelDialogVisible = signal(false);
    motivoCancelacion = signal('');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenCompraId.set(+id);
            this.store.dispatch(loadOrdenCompraById({ id: +id }));

            this.store
                .select(OrdenesCompraSelectors.selectOrdenCompraById(+id))
                .pipe(takeUntil(this.destroy$))
                .subscribe((val) => {
                    if (val) this.ordenCompra.set(val);
                });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onEdit(): void {
        this.router.navigate(['/app/ordenes-compra', this.ordenCompraId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/ordenes-compra']);
    }

    puedePasarA(destino: OrdenCompraEstado): boolean {
        return ordenCompraPuedeTransitar(this.ordenCompra()?.estado ?? null, destino);
    }

    puedeCancelar(): boolean {
        return ordenCompraPuedeCancelar(this.ordenCompra()?.estado ?? null);
    }

    transitionTo(estadoDestino: OrdenCompraEstado): void {
        this.store.dispatch(
            transitionOrdenCompra({
                id: this.ordenCompraId(),
                data: { estado_destino: estadoDestino }
            })
        );
    }

    openCancelDialog(): void {
        this.motivoCancelacion.set('');
        this.cancelDialogVisible.set(true);
    }

    confirmCancel(): void {
        const data = {
            estado_destino: 'Cancelada' as OrdenCompraEstado,
            motivo_cancelacion: this.motivoCancelacion(),
            aprobacion_admin: this.ordenCompra()?.estado === 'Confirmada' ? true : undefined
        };

        this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
        this.cancelDialogVisible.set(false);
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Confirmada':
            case 'Recibida':
            case 'Cerrada':
                return 'success';
            case 'Enviada':
                return 'info';
            case 'Pendiente de envío':
            case 'Recibida parcialmente':
                return 'warn';
            case 'Cancelada':
                return 'danger';
            default:
                return 'secondary';
        }
    }
}
