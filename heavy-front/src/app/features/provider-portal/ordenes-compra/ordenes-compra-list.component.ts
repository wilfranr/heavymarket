import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ProviderPortalService } from '../services/provider-portal.service';
import { TransportadoraService } from '../../../core/services/transportadora.service';
import { OrdenCompra, OrdenCompraEstado, ConfirmPurchaseOrderItemDto } from '../../../core/models/orden-compra.model';

interface SelectOption<T> {
    label: string;
    value: T;
}

interface ApiErrorResponse {
    error?: {
        message?: string;
    };
}

export interface ConfirmStockItemForm {
    referencia_id: number;
    nombre: string;
    cantidad_solicitada: number;
    cantidad_disponible: number;
    motivo_faltante: string;
}

export function proveedorPuedeConfirmarOrden(estado: OrdenCompraEstado | null): boolean {
    return estado === 'Enviada' || estado === 'Pendiente de Revisión de Stock';
}

export function proveedorPuedeDespacharOrden(estado: OrdenCompraEstado | null): boolean {
    return estado === 'Pagada' || estado === 'Pagada / Lista para Despacho';
}

@Component({
    selector: 'app-ordenes-compra-list',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, SelectModule, TagModule, ToastModule, InputTextModule, InputNumberModule, TextareaModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2 class="m-0"><i class="pi pi-shopping-bag text-emerald-600 mr-2"></i>Mis Órdenes de Compra</h2>
                <p-button icon="pi pi-refresh" [loading]="loading()" (onClick)="loadPurchaseOrders()" [outlined]="true" label="Actualizar"></p-button>
            </div>

            <p-table [value]="orders()" [loading]="loading()" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>OC #</th>
                        <th>Fecha Expedición</th>
                        <th>Cliente</th>
                        <th class="text-right">Total orden</th>
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
                            <div class="flex justify-center gap-2">
                                <p-button icon="pi pi-eye" [outlined]="true" severity="secondary" (onClick)="viewDetails(oc)" pTooltip="Ver Detalles"></p-button>
                                @if (proveedorPuedeConfirmarOrden(oc.estado)) {
                                    <p-button icon="pi pi-check" severity="success" (onClick)="openConfirmDialog(oc)" label="Confirmar Stock"></p-button>
                                }
                                @if (proveedorPuedeDespacharOrden(oc.estado)) {
                                    <p-button icon="pi pi-send" severity="success" (onClick)="openDispatchDialog(oc)" label="Despachar"></p-button>
                                }
                            </div>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Diálogo de Confirmación de Stock -->
        <p-dialog [visible]="displayConfirm()" (visibleChange)="displayConfirm.set($event)" [header]="'Confirmar Inventario OC-' + selectedOrder()?.id" [modal]="true" [style]="{ width: '750px' }">
            <div class="mb-4">
                <p class="text-sm text-gray-500 m-0">Verifique las cantidades solicitadas y ajuste las unidades disponibles si presenta faltantes de stock.</p>
            </div>

            @if (hayFaltantes()) {
                <div class="p-3 mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
                    <i class="pi pi-exclamation-triangle mt-0.5 text-base"></i>
                    <div><strong>Aviso de faltantes:</strong> Al confirmar cantidades inferiores a las solicitadas, la orden transicionará a <em>Stock Incompleto</em> para evaluación y aprobación por parte del asesor comercial.</div>
                </div>
            }

            <p-table [value]="confirmItems()" styleClass="p-datatable-sm mb-4">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Referencia</th>
                        <th class="text-center" style="width: 100px">Solicitada</th>
                        <th class="text-center" style="width: 150px">Disponible</th>
                        <th>Motivo Faltante</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                    <tr>
                        <td class="font-medium text-sm">{{ item.nombre }}</td>
                        <td class="text-center text-sm font-semibold">{{ item.cantidad_solicitada }}</td>
                        <td class="text-center">
                            <p-inputNumber
                                [ngModel]="item.cantidad_disponible"
                                (ngModelChange)="actualizarCantidadDisponible(item, $event)"
                                [min]="0"
                                [max]="item.cantidad_solicitada"
                                [showButtons]="true"
                                buttonLayout="horizontal"
                                incrementButtonIcon="pi pi-plus"
                                decrementButtonIcon="pi pi-minus"
                                inputStyleClass="text-center w-16"
                                styleClass="w-full"
                            ></p-inputNumber>
                        </td>
                        <td>
                            @if (item.cantidad_disponible < item.cantidad_solicitada) {
                                <input pInputText [(ngModel)]="item.motivo_faltante" placeholder="Motivo del faltante (obligatorio)" class="w-full text-xs p-inputtext-sm" />
                            } @else {
                                <span class="text-xs text-muted-color">Stock completo</span>
                            }
                        </td>
                    </tr>
                </ng-template>
            </p-table>

            <div class="field mb-4">
                <label for="confirmObs" class="block text-sm font-medium mb-1">Observaciones generales para el asesor</label>
                <textarea pTextarea id="confirmObs" [(ngModel)]="confirmObservaciones" rows="2" class="w-full text-sm" placeholder="Comentarios adicionales sobre la entrega o despacho..."></textarea>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="displayConfirm.set(false)"></p-button>
                <p-button
                    [label]="hayFaltantes() ? 'Confirmar con Faltantes' : 'Confirmar Stock Completo'"
                    [severity]="hayFaltantes() ? 'warn' : 'success'"
                    [icon]="hayFaltantes() ? 'pi pi-exclamation-circle' : 'pi pi-check'"
                    [loading]="submitting()"
                    [disabled]="!confirmacionValida()"
                    (onClick)="submitConfirmOrder()"
                ></p-button>
            </div>
        </p-dialog>

        <!-- Diálogo de Detalles -->
        <p-dialog [visible]="displayDetails()" (visibleChange)="displayDetails.set($event)" [header]="'Detalle de Orden OC-' + selectedOrder()?.id" [modal]="true" [style]="{ width: '700px' }">
            @if (selectedOrder(); as order) {
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label class="block text-sm font-medium mb-1">Fecha Expedición</label>
                        <div>{{ order.fecha_expedicion | date: 'mediumDate' }}</div>
                    </div>
                    <div class="field">
                        <label class="block text-sm font-medium mb-1">Estado Actual</label>
                        <p-tag [value]="order.estado || 'N/A'" [severity]="getStatusSeverity(order.estado)"></p-tag>
                    </div>
                    @if (order.guia) {
                        <div class="field">
                            <label class="block text-sm font-medium mb-1">Número de Guía</label>
                            <div class="font-bold">{{ order.guia }}</div>
                        </div>
                        <div class="field">
                            <label class="block text-sm font-medium mb-1">Transportadora</label>
                            <div>{{ order.transportadora?.nombre || 'N/A' }}</div>
                        </div>
                    }
                </div>

                <h4 class="mt-4 pb-2" style="border-bottom: 1px solid var(--p-surface-border)">Referencias Solicitadas</h4>
                <p-table [value]="order.detalles || []" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Referencia</th>
                            <th class="text-center">Cantidad</th>
                            <th class="text-right">Costo unitario</th>
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

                <div class="flex justify-end mt-4">
                    <p-button label="Cerrar" (onClick)="displayDetails.set(false)"></p-button>
                </div>
            }
        </p-dialog>

        <!-- Diálogo de Despacho con Evidencias Obligatorias -->
        <p-dialog [visible]="displayDispatch()" (visibleChange)="displayDispatch.set($event)" [header]="'Registrar Despacho OC-' + selectedOrder()?.id" [modal]="true" [style]="{ width: '520px' }">
            <form [formGroup]="dispatchForm" (ngSubmit)="onDispatchSubmit()">
                <div class="field mb-4">
                    <label for="transp" class="block font-bold mb-2">Transportadora <span class="text-red-500">*</span></label>
                    <p-select [options]="transportadoras()" formControlName="transportadora_id" optionLabel="label" optionValue="value" [filter]="true" placeholder="Seleccione transportadora" styleClass="w-full"></p-select>
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
                    <label class="block font-bold mb-1">Fotos del Paquete Embalado y Guía Digital <span class="text-red-500">*</span></label>
                    <p class="text-xs text-muted-color mb-2">Es obligatorio adjuntar al menos una foto del paquete listo y/o la guía física de la transportadora (JPG, PNG, PDF, máx 10MB c/u).</p>
                    <input
                        type="file"
                        multiple
                        (change)="onDispatchFilesSelected($event)"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        class="w-full text-sm text-color file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-emphasis cursor-pointer"
                    />

                    @if (dispatchFiles().length > 0) {
                        <div class="mt-3 flex flex-col gap-1.5 max-h-36 overflow-y-auto p-2 bg-surface-50 dark:bg-surface-800 rounded border border-surface-200 dark:border-surface-700">
                            @for (file of dispatchFiles(); track file.name; let idx = $index) {
                                <div class="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                                    <div class="flex items-center gap-2 truncate max-w-[340px]">
                                        <i [class]="file.type.includes('pdf') ? 'pi pi-file-pdf text-red-500' : 'pi pi-image text-emerald-500'"></i>
                                        <span class="truncate" [title]="file.name">{{ file.name }}</span>
                                        <span class="text-muted-color">({{ (file.size / 1024).toFixed(1) }} KB)</span>
                                    </div>
                                    <p-button icon="pi pi-times" [rounded]="true" [text]="true" severity="danger" (onClick)="removeDispatchFile(idx)" styleClass="w-6 h-6"></p-button>
                                </div>
                            }
                        </div>
                    } @else {
                        <div class="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <i class="pi pi-exclamation-triangle"></i>
                            <span>Debe cargar al menos un archivo fotográfico para poder confirmar el despacho.</span>
                        </div>
                    }
                </div>

                <div class="field mb-4">
                    <label for="obs" class="block font-bold mb-2">Observaciones de Entrega</label>
                    <textarea pTextarea id="obs" formControlName="observaciones" rows="2" class="w-full" placeholder="Detalles de embalaje, precintos o instrucciones al conductor..."></textarea>
                </div>

                <div class="flex justify-end gap-2 mt-5">
                    <p-button label="Cancelar" severity="secondary" [outlined]="true" (onClick)="displayDispatch.set(false)"></p-button>
                    <p-button label="Confirmar Despacho" severity="success" icon="pi pi-send" type="submit" [loading]="submitting()" [disabled]="dispatchForm.invalid || dispatchFiles().length === 0"></p-button>
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

    orders = signal<OrdenCompra[]>([]);
    loading = signal(false);
    submitting = signal(false);
    displayDetails = signal(false);
    displayDispatch = signal(false);
    displayConfirm = signal(false);
    selectedOrder = signal<OrdenCompra | null>(null);
    confirmItems = signal<ConfirmStockItemForm[]>([]);
    confirmObservaciones = '';
    transportadoras = signal<SelectOption<number>[]>([]);
    dispatchFiles = signal<File[]>([]);
    dispatchForm!: FormGroup;
    protected readonly proveedorPuedeConfirmarOrden = proveedorPuedeConfirmarOrden;
    protected readonly proveedorPuedeDespacharOrden = proveedorPuedeDespacharOrden;

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
                this.transportadoras.set(response.data.map((t) => ({ label: t.nombre, value: t.id })));
            }
        });
    }

    viewDetails(oc: OrdenCompra): void {
        this.selectedOrder.set(oc);
        this.displayDetails.set(true);
    }

    openConfirmDialog(oc: OrdenCompra): void {
        this.selectedOrder.set(oc);
        this.confirmObservaciones = '';
        const items = (oc.detalles || oc.referencias || []).map((det) => ({
            referencia_id: det.referencia_id,
            nombre: det.referencia?.referencia || det.referencia?.codigo_heavymarket || `Ref #${det.referencia_id}`,
            cantidad_solicitada: det.cantidad_original ?? det.cantidad,
            cantidad_disponible: det.cantidad,
            motivo_faltante: det.motivo_faltante || ''
        }));
        this.confirmItems.set(items);
        this.displayConfirm.set(true);
    }

    actualizarCantidadDisponible(item: ConfirmStockItemForm, nuevaCantidad: number | null): void {
        const cant = nuevaCantidad ?? 0;
        item.cantidad_disponible = cant;
        if (cant >= item.cantidad_solicitada) {
            item.motivo_faltante = '';
        }
        this.confirmItems.set([...this.confirmItems()]);
    }

    hayFaltantes(): boolean {
        return this.confirmItems().some((item) => item.cantidad_disponible < item.cantidad_solicitada);
    }

    confirmacionValida(): boolean {
        const items = this.confirmItems();
        if (items.length === 0) return true;

        // Si tiene faltantes en una línea, el motivo del faltante debe estar diligenciado
        return items.every((item) => {
            if (item.cantidad_disponible < item.cantidad_solicitada) {
                return item.motivo_faltante.trim().length > 0;
            }
            return true;
        });
    }

    submitConfirmOrder(): void {
        const oc = this.selectedOrder();
        if (!oc || !this.confirmacionValida()) return;

        this.submitting.set(true);
        const payload: { observaciones?: string; items?: ConfirmPurchaseOrderItemDto[] } = {
            observaciones: this.confirmObservaciones.trim() || undefined,
            items: this.confirmItems().map((item) => ({
                referencia_id: item.referencia_id,
                cantidad_disponible: item.cantidad_disponible,
                motivo_faltante: item.cantidad_disponible < item.cantidad_solicitada ? item.motivo_faltante.trim() : undefined
            }))
        };

        this.providerPortalService.confirmPurchaseOrder(oc.id, payload).subscribe({
            next: (res) => {
                const message = res.message || 'Orden confirmada correctamente.';
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: message });
                this.displayConfirm.set(false);
                this.submitting.set(false);
                this.loadPurchaseOrders();
            },
            error: (error: ApiErrorResponse) => {
                const errorMsg = error.error?.message || 'Error al confirmar la orden.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                this.submitting.set(false);
            }
        });
    }

    confirmOrder(oc: OrdenCompra): void {
        this.openConfirmDialog(oc);
    }

    openDispatchDialog(oc: OrdenCompra): void {
        this.selectedOrder.set(oc);
        this.dispatchFiles.set([]);
        this.dispatchForm.reset({
            transportadora_id: oc.transportadora_id,
            guia: oc.guia || '',
            fecha_despacho: oc.fecha_despacho ? new Date(oc.fecha_despacho).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            observaciones: oc.observaciones || ''
        });
        this.displayDispatch.set(true);
    }

    onDispatchFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const current = [...this.dispatchFiles()];
        const newFiles = Array.from(input.files);
        // Evitar duplicados por nombre y tamaño
        for (const file of newFiles) {
            if (!current.some((f) => f.name === file.name && f.size === file.size)) {
                current.push(file);
            }
        }
        this.dispatchFiles.set(current);
        input.value = '';
    }

    removeDispatchFile(index: number): void {
        const current = [...this.dispatchFiles()];
        current.splice(index, 1);
        this.dispatchFiles.set(current);
    }

    onDispatchSubmit(): void {
        const selectedOrder = this.selectedOrder();
        const files = this.dispatchFiles();
        if (this.dispatchForm.invalid || !selectedOrder || files.length === 0) return;

        this.submitting.set(true);

        const formData = new FormData();
        const formVal = this.dispatchForm.value;
        formData.append('transportadora_id', String(formVal.transportadora_id));
        formData.append('guia', formVal.guia.trim());
        formData.append('fecha_despacho', formVal.fecha_despacho);
        if (formVal.observaciones?.trim()) {
            formData.append('observaciones', formVal.observaciones.trim());
        }

        files.forEach((file) => {
            formData.append('fotos[]', file, file.name);
        });

        this.providerPortalService.registerDispatch(selectedOrder.id, formData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Despacho registrado correctamente con sus evidencias.' });
                this.displayDispatch.set(false);
                this.dispatchFiles.set([]);
                this.submitting.set(false);
                this.loadPurchaseOrders();
            },
            error: (error: ApiErrorResponse) => {
                const errorMsg = error.error?.message || 'Error al registrar el despacho.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                this.submitting.set(false);
            }
        });
    }

    getStatusSeverity(status: OrdenCompraEstado | null): 'info' | 'success' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
        switch (status) {
            case 'Generada':
            case 'Recibida parcialmente':
                return 'warn';
            case 'Enviada':
            case 'Despachada':
                return 'info';
            case 'Confirmada':
            case 'Pagada':
            case 'Recibida':
                return 'success';
            case 'Cancelada':
                return 'danger';
            default:
                return 'secondary';
        }
    }
}
