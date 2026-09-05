import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { OrdenTrabajoService } from '../../../core/services/orden-trabajo.service';
import { OrdenTrabajo, OrdenTrabajoResumenFacturacion } from '../../../core/models/orden-trabajo.model';

/**
 * Bandeja de Contabilidad: Ordenes de Trabajo listas para facturar.
 * HeavyMarket no reemplaza el software contable, solo registra el numero
 * de factura ya emitido externamente y cierra la orden.
 */
@Component({
    selector: 'app-ordenes-trabajo-facturacion',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, DialogModule, InputTextModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Facturación de Órdenes de Trabajo</h2>
            <p class="text-muted-color mb-4">Órdenes de trabajo listas para facturar (recibido + depurado = cotizado en todas sus líneas).</p>

            <p-table [value]="ordenes()" [loading]="loading()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Pedido</th>
                        <th>Fecha de ingreso</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-orden>
                    <tr>
                        <td>OT-{{ orden.id }}</td>
                        <td>{{ orden.tercero?.nombre || 'N/A' }}</td>
                        <td>#{{ orden.pedido_id || 'N/A' }}</td>
                        <td>{{ orden.fecha_ingreso | date: 'short' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onView(orden.id)"></p-button>
                            <p-button label="Facturar" icon="pi pi-file-invoice" (onClick)="openFacturarDialog(orden)"></p-button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="5" class="text-center py-6 text-muted-color">No hay órdenes de trabajo listas para facturar.</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-dialog header="Facturar orden de trabajo" [modal]="true" [visible]="facturarDialogVisible()" (visibleChange)="facturarDialogVisible.set($event)" [style]="{ width: 'min(640px, 95vw)' }">
            @if (ordenSeleccionada(); as orden) {
                <div class="flex flex-col gap-4">
                    <span class="font-semibold text-color">OT-{{ orden.id }} · {{ orden.tercero?.nombre || 'N/A' }}</span>

                    @if (resumen(); as r) {
                        <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
                            <table class="w-full text-sm">
                                <thead class="bg-surface-50 dark:bg-surface-800">
                                    <tr>
                                        <th class="text-left p-2 text-xs uppercase text-color font-bold">Referencia</th>
                                        <th class="text-center p-2 text-xs uppercase text-color font-bold">Cant. a facturar</th>
                                        <th class="text-right p-2 text-xs uppercase text-color font-bold">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (linea of r.lineas; track linea.referencia_id) {
                                        <tr class="border-t border-surface-200 dark:border-surface-700">
                                            <td class="p-2 text-color-secondary">{{ linea.referencia || '#' + linea.referencia_id }}</td>
                                            <td class="p-2 text-center text-color">{{ linea.cantidad_facturable }}</td>
                                            <td class="p-2 text-right text-color">{{ linea.subtotal | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                        </tr>
                                    }
                                </tbody>
                                <tfoot>
                                    <tr class="border-t border-surface-200 dark:border-surface-700">
                                        <td colspan="2" class="p-2 text-right font-bold uppercase text-xs text-muted-color">Total</td>
                                        <td class="p-2 text-right font-bold text-color">{{ r.total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    }

                    <div class="field">
                        <label class="block mb-2 text-sm font-medium text-color">Número de factura</label>
                        <input pInputText [ngModel]="numeroFactura()" (ngModelChange)="numeroFactura.set($event)" class="w-full" placeholder="Ej. FE-00123" />
                    </div>

                    <div class="field">
                        <label class="block mb-2 text-sm font-medium text-color">Comprobante de factura (PDF, opcional)</label>
                        <input type="file" accept="application/pdf" (change)="onFacturaPdfSelected($event)" class="w-full text-sm" />
                    </div>
                </div>
            }
            <ng-template pTemplate="footer">
                <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="facturarDialogVisible.set(false)" />
                <p-button label="Facturar orden" icon="pi pi-check" [disabled]="!numeroFactura() || facturando()" [loading]="facturando()" (onClick)="confirmarFactura()" />
            </ng-template>
        </p-dialog>
    `
})
export class FacturacionComponent implements OnInit {
    private readonly ordenTrabajoService = inject(OrdenTrabajoService);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    ordenes = signal<OrdenTrabajo[]>([]);
    loading = signal(false);

    facturarDialogVisible = signal(false);
    ordenSeleccionada = signal<OrdenTrabajo | null>(null);
    resumen = signal<OrdenTrabajoResumenFacturacion | null>(null);
    numeroFactura = signal<string | null>(null);
    facturaPdfFile: File | null = null;
    facturando = signal(false);

    ngOnInit(): void {
        this.cargarOrdenes();
    }

    private cargarOrdenes(): void {
        this.loading.set(true);
        this.ordenTrabajoService.getAll({ estado: 'Lista para Facturar', per_page: 100 }).subscribe({
            next: (response) => {
                this.ordenes.set(response.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    onView(id: number): void {
        this.router.navigate(['/app/ordenes-trabajo', id]);
    }

    openFacturarDialog(orden: OrdenTrabajo): void {
        this.ordenSeleccionada.set(orden);
        this.numeroFactura.set(null);
        this.facturaPdfFile = null;
        this.resumen.set(null);
        this.facturarDialogVisible.set(true);

        this.ordenTrabajoService.getResumenFacturacion(orden.id).subscribe((resumen) => {
            this.resumen.set(resumen);
        });
    }

    onFacturaPdfSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.facturaPdfFile = input.files?.[0] ?? null;
    }

    confirmarFactura(): void {
        const orden = this.ordenSeleccionada();
        const numero = this.numeroFactura();

        if (!orden || !numero) {
            return;
        }

        const formData = new FormData();
        formData.append('numero_factura', numero);
        if (this.facturaPdfFile) {
            formData.append('factura_pdf', this.facturaPdfFile);
        }

        this.facturando.set(true);
        this.ordenTrabajoService.facturar(orden.id, formData).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Orden de trabajo facturada exitosamente' });
                this.facturando.set(false);
                this.facturarDialogVisible.set(false);
                this.cargarOrdenes();
            },
            error: (error) => {
                this.facturando.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'Error al facturar la orden de trabajo' });
            }
        });
    }
}
