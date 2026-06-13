import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ProviderPortalService } from '../services/provider-portal.service';
import { TransportadoraService } from '../../../core/services/transportadora.service';

@Component({
    selector: 'app-ordenes-compra-list',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, DialogModule, ReactiveFormsModule, SelectModule, TagModule, ToastModule, InputTextModule, TextareaModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2 class="m-0"><i class="pi pi-shopping-bag text-emerald-600 mr-2"></i>Mis Órdenes de Compra</h2>
                <p-button icon="pi pi-refresh" [loading]="loading()" (onClick)="loadPurchaseOrders()" [outlined]="true" label="Actualizar"></p-button>
            </div>

            <p-table [value]="orders()" [loading]="loading()" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>OC #</th>
                        <th>Fecha Expedición</th>
                        <th>Cliente</th>
                        <th class="text-right">Valor Total</th>
                        <th class="text-center">Estado</th>
                        <th class="text-center">Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-oc>
                    <tr>
                        <td class="font-bold">OC-{{ oc.id }}</td>
                        <td>{{ oc.fecha_expedicion | date: 'dd/MM/yyyy' }}</td>
                        <td>{{ oc.tercero?.razon_social || oc.tercero?.nombre || 'N/A' }}</td>
                        <td class="text-right font-medium">{{ oc.valor_total | currency }}</td>
                        <td class="text-center">
                            <p-tag [value]="oc.estado" [severity]="getStatusSeverity(oc.estado)"></p-tag>
                        </td>
                        <td class="text-center">
                            <div class="flex justify-content-center gap-2">
                                <p-button icon="pi pi-eye" [outlined]="true" severity="secondary" (onClick)="viewDetails(oc)" pTooltip="Ver Detalles"></p-button>
                                @if (oc.estado === 'Pendiente' || oc.estado === 'En Proceso') {
                                    <p-button icon="pi pi-send" severity="success" (onClick)="openDispatchDialog(oc)" label="Despachar"></p-button>
                                }
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Diálogo de Detalles -->
        <p-dialog [(visible)]="displayDetails" [header]="'Detalle de Orden OC-' + selectedOrder?.id" [modal]="true" [style]="{ width: '700px' }">
            @if (selectedOrder) {
                <div class="grid">
                    <div class="col-6 mb-3">
                        <label class="block text-500 font-medium mb-1">Fecha Expedición</label>
                        <div class="text-900">{{ selectedOrder.fecha_expedicion | date: 'mediumDate' }}</div>
                    </div>
                    <div class="col-6 mb-3">
                        <label class="block text-500 font-medium mb-1">Estado Actual</label>
                        <p-tag [value]="selectedOrder.estado" [severity]="getStatusSeverity(selectedOrder.estado)"></p-tag>
                    </div>
                    @if (selectedOrder.guia) {
                        <div class="col-6 mb-3">
                            <label class="block text-500 font-medium mb-1">Número de Guía</label>
                            <div class="text-900 font-bold">{{ selectedOrder.guia }}</div>
                        </div>
                        <div class="col-6 mb-3">
                            <label class="block text-500 font-medium mb-1">Transportadora</label>
                            <div class="text-900">{{ selectedOrder.transportadora?.nombre || 'N/A' }}</div>
                        </div>
                    }
                </div>

                <h4 class="mt-4 border-bottom-1 surface-border pb-2">Referencias Solicitadas</h4>
                <p-table [value]="selectedOrder.detalles || []" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Referencia</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-right">Precio Unit.</th>
                            <th class="text-right">Subtotal</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-det>
                        <tr>
                            <td>{{ det.referencia?.referencia || 'N/A' }}</td>
                            <td class="text-center">{{ det.cantidad }}</td>
                            <td class="text-right">{{ det.valor_unitario | currency }}</td>
                            <td class="text-right">{{ det.valor_total | currency }}</td>
                        </tr>
                    </ng-template>
                </p-table>

                <div class="flex justify-content-end mt-4">
                    <p-button label="Cerrar" (onClick)="displayDetails = false"></p-button>
                </div>
            }
        </p-dialog>

        <!-- Diálogo de Despacho -->
        <p-dialog [(visible)]="displayDispatch" [header]="'Registrar Despacho OC-' + selectedOrder?.id" [modal]="true" [style]="{ width: '450px' }">
            <form [formGroup]="dispatchForm" (ngSubmit)="onDispatchSubmit()">
                <div class="field mb-4">
                    <label for="transp" class="block font-bold mb-2">Transportadora <span class="text-red-500">*</span></label>
                    <p-select [options]="transportadoras" formControlName="transportadora_id" optionLabel="label" optionValue="value" [filter]="true" placeholder="Seleccione transportadora" styleClass="w-full"></p-select>
                </div>

                <div class="field mb-4">
                    <label for="guia" class="block font-bold mb-2">Número de Guía <span class="text-red-500">*</span></label>
                    <input pInputText id="guia" formControlName="guia" class="w-full" placeholder="Ej: 123456789" />
                </div>

                <div class="field mb-4">
                    <label for="fecha" class="block font-bold mb-2">Fecha de Despacho <span class="text-red-500">*</span></label>
                    <input type="date" formControlName="fecha_despacho" class="w-full p-inputtext p-component" />
                </div>

                <div class="field mb-4">
                    <label for="obs" class="block font-bold mb-2">Observaciones</label>
                    <textarea pInputTextarea id="obs" formControlName="observaciones" rows="3" class="w-full" placeholder="Notas sobre el envío..."></textarea>
                </div>

                <div class="flex justify-content-end gap-2 mt-5">
                    <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="displayDispatch = false"></p-button>
                    <p-button label="Confirmar Despacho" severity="success" type="submit" [loading]="submitting()" [disabled]="dispatchForm.invalid"></p-button>
                </div>
            </form>
        </p-dialog>

        <p-toast></p-toast>
    `
})
export class OrdenesCompraListComponent implements OnInit {
    private providerPortalService = inject(ProviderPortalService);
    private transportadoraService = inject(TransportadoraService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);

    orders = signal<any[]>([]);
    loading = signal(false);
    submitting = signal(false);
    displayDetails = false;
    displayDispatch = false;
    selectedOrder: any = null;
    transportadoras: any[] = [];
    dispatchForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadPurchaseOrders();
        this.loadTransportadoras();
    }

    private initForm(): void {
        this.dispatchForm = this.fb.group({
            transportadora_id: [null, [Validators.required]],
            guia: ['', [Validators.required]],
            fecha_despacho: [new Date().toISOString().split('T')[0], [Validators.required]],
            observaciones: ['']
        });
    }

    loadPurchaseOrders(): void {
        this.loading.set(true);
        this.providerPortalService.getPurchaseOrders().subscribe({
            next: (response) => {
                this.orders.set(response.data);
                this.loading.set(false);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar sus órdenes de compra.' });
                this.loading.set(false);
            }
        });
    }

    private loadTransportadoras(): void {
        this.transportadoraService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.transportadoras = response.data.map((t) => ({ label: t.nombre, value: t.id }));
            }
        });
    }

    viewDetails(oc: any): void {
        this.selectedOrder = oc;
        this.displayDetails = true;
    }

    openDispatchDialog(oc: any): void {
        this.selectedOrder = oc;
        this.dispatchForm.reset({
            transportadora_id: oc.transportadora_id,
            guia: oc.guia || '',
            fecha_despacho: oc.fecha_despacho ? new Date(oc.fecha_despacho).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            observaciones: oc.observaciones || ''
        });
        this.displayDispatch = true;
    }

    onDispatchSubmit(): void {
        if (this.dispatchForm.invalid || !this.selectedOrder) return;

        this.submitting.set(true);
        this.providerPortalService.registerDispatch(this.selectedOrder.id, this.dispatchForm.value).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Despacho registrado correctamente.' });
                this.displayDispatch = false;
                this.submitting.set(false);
                this.loadPurchaseOrders();
            },
            error: (error) => {
                const errorMsg = error.error?.message || 'Error al registrar el despacho.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                this.submitting.set(false);
            }
        });
    }

    getStatusSeverity(status: string): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'Pendiente':
                return 'warn';
            case 'En Proceso':
                return 'info';
            case 'Despachado':
                return 'success';
            case 'Entregado':
                return 'success';
            case 'Cancelado':
                return 'danger';
            default:
                return 'secondary';
        }
    }
}
