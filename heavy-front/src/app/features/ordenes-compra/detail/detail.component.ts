import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { loadOrdenCompraById } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { OrdenCompra } from '../../../core/models/orden-compra.model';

/**
 * Componente de detalle de orden de compra
 */
@Component({
    selector: 'app-orden-compra-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule, TableModule, TooltipModule],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2>Orden de Compra OC-{{ ordenCompraId() }}</h2>
                <div class="flex gap-2">
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"> </p-button>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"> </p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando orden de compra...</p>
                </div>
            } @else if (ordenCompra()) {
                <div class="grid">
                    <!-- Información General -->
                    <div class="col-12">
                        <p-card header="Información General">
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <p><strong>ID:</strong> OC-{{ ordenCompra()?.id }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Estado:</strong>
                                        @if (ordenCompra()?.estado) {
                                            <p-tag [value]="ordenCompra()!.estado || 'N/A'" [severity]="getEstadoSeverity(ordenCompra()!.estado || 'Pendiente')"> </p-tag>
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Color:</strong>
                                        @if (ordenCompra()?.color) {
                                            <div
                                                [style.background-color]="ordenCompra()!.color"
                                                [style.width]="'20px'"
                                                [style.height]="'20px'"
                                                [style.border-radius]="'50%'"
                                                [style.display]="'inline-block'"
                                                [style.margin-left]="'8px'"
                                                [title]="getColorTooltip(ordenCompra()!.color!)"
                                            ></div>
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Proveedor:</strong> {{ ordenCompra()?.proveedor?.razon_social || ordenCompra()?.proveedor?.nombre_comercial || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Cliente:</strong> {{ ordenCompra()?.tercero?.razon_social || ordenCompra()?.tercero?.nombre_comercial || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Pedido:</strong> #{{ ordenCompra()?.pedido_id || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Fecha de Expedición:</strong>
                                        @if (ordenCompra()?.fecha_expedicion) {
                                            {{ ordenCompra()!.fecha_expedicion | date: 'short' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Fecha de Entrega:</strong>
                                        @if (ordenCompra()?.fecha_entrega) {
                                            {{ ordenCompra()!.fecha_entrega | date: 'short' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Valor Total:</strong>
                                        @if (ordenCompra()?.valor_total) {
                                            {{ ordenCompra()!.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                @if (ordenCompra()?.direccion) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Dirección:</strong> {{ ordenCompra()!.direccion }}</p>
                                    </div>
                                }
                                @if (ordenCompra()?.telefono) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Teléfono:</strong> {{ ordenCompra()!.telefono }}</p>
                                    </div>
                                }
                                @if (ordenCompra()?.guia) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Guía:</strong> {{ ordenCompra()!.guia }}</p>
                                    </div>
                                }
                                @if (ordenCompra()?.observaciones) {
                                    <div class="col-12">
                                        <p><strong>Observaciones:</strong></p>
                                        <p class="mt-2">{{ ordenCompra()!.observaciones }}</p>
                                    </div>
                                }
                            </div>
                        </p-card>
                    </div>

                    <!-- Referencias -->
                    @if (ordenCompra()?.referencias && ordenCompra()!.referencias!.length > 0) {
                        <div class="col-12">
                            <p-card header="Referencias">
                                <p-table [value]="ordenCompra()!.referencias!" styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th>ID</th>
                                            <th>Referencia</th>
                                            <th>Cantidad</th>
                                            <th>Valor Unitario</th>
                                            <th>Valor Total</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-item>
                                        <tr>
                                            <td>{{ item.id }}</td>
                                            <td>{{ item.referencia?.referencia || 'N/A' }}</td>
                                            <td>{{ item.cantidad }}</td>
                                            <td>{{ item.valor_unitario | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                            <td>{{ item.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-card>
                        </div>
                    }
                </div>
            } @else {
                <div class="text-center py-8">
                    <p class="text-xl text-gray-500">Orden de compra no encontrada</p>
                </div>
            }
        </div>
    `,
    styles: []
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    ordenCompra = signal<OrdenCompra | null>(null);
    ordenCompraId = signal<number>(0);
    loading = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenCompraId.set(+id);
            this.loadOrdenCompra(+id);
        }
    }

    private loadOrdenCompra(id: number): void {
        this.store.dispatch(loadOrdenCompraById({ id }));

        this.store.select(OrdenesCompraSelectors.selectOrdenCompraById(id)).subscribe((ordenCompra) => {
            if (ordenCompra) {
                this.ordenCompra.set(ordenCompra);
                this.loading.set(false);
            }
        });
    }

    onEdit(): void {
        this.router.navigate(['/app/ordenes-compra', this.ordenCompraId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/ordenes-compra']);
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Entregado':
                return 'success';
            case 'En proceso':
                return 'info';
            case 'Pendiente':
                return 'warn';
            case 'Cancelado':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getColorTooltip(color: string): string {
        switch (color) {
            case '#FFFF00':
                return 'En proceso';
            case '#00ff00':
                return 'Entregado';
            case '#ff0000':
                return 'Cancelado';
            default:
                return 'Desconocido';
        }
    }
}
