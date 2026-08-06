import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { createOrdenCompra } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { CreateOrdenCompraDto, OrdenCompraEstado, OrdenCompraColor } from '../../../core/models/orden-compra.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PaginatedResponse } from '../../../core/services/api.service';
import { Referencia } from '../../../core/models/referencia.model';

/**
 * Componente de creación de orden de compra
 */
@Component({
    selector: 'app-orden-compra-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, InputNumberModule, TableModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2 class="m-0">Nueva Orden de Compra</h2>
                <div class="flex gap-2">
                    <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="onCancel()"></p-button>
                    <p-button label="Guardar Orden" icon="pi pi-check" [loading]="loading()" [disabled]="ordenCompraForm.invalid" (onClick)="onSubmit()"></p-button>
                </div>
            </div>

            <form [formGroup]="ordenCompraForm">
                <p-card header="Información General" styleClass="mb-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block mb-2 font-bold">Proveedor <span class="text-red-500">*</span></label>
                            <p-select formControlName="proveedor_id" [options]="proveedores()" placeholder="Seleccione proveedor" [filter]="true" styleClass="w-full"></p-select>
                        </div>
                        <div>
                            <label class="block mb-2 font-bold">Pedido (Opcional)</label>
                            <p-select formControlName="pedido_id" [options]="pedidos()" placeholder="Vincular pedido" [filter]="true" [showClear]="true" styleClass="w-full"></p-select>
                        </div>
                        <div>
                            <label class="block mb-2 font-bold">Estado</label>
                            <p-select formControlName="estado" [options]="estadosOptions" styleClass="w-full"></p-select>
                        </div>
                        <div>
                            <label class="block mb-2 font-bold">Fecha Expedición <span class="text-red-500">*</span></label>
                            <input type="date" formControlName="fecha_expedicion" class="w-full p-inputtext" />
                        </div>
                        <div>
                            <label class="block mb-2 font-bold">Fecha Entrega <span class="text-red-500">*</span></label>
                            <input type="date" formControlName="fecha_entrega" class="w-full p-inputtext" />
                        </div>
                        <div>
                            <label class="block mb-2 font-bold">Color</label>
                            <p-select formControlName="color" [options]="coloresOptions" styleClass="w-full">
                                <ng-template let-option pTemplate="item">
                                    <div class="flex items-center gap-2">
                                        <div [style.background-color]="option.value" class="w-4 h-4 rounded-full border border-gray-400"></div>
                                        <span>{{ option.label }}</span>
                                    </div>
                                </ng-template>
                            </p-select>
                        </div>
                    </div>
                    <div class="mt-4">
                        <label class="block mb-2 font-bold">Observaciones</label>
                        <textarea formControlName="observaciones" pInputTextarea rows="2" class="w-full"></textarea>
                    </div>
                </p-card>

                <p-card header="Referencias / Productos">
                    <div class="mb-4">
                        <div class="flex gap-2 items-end">
                            <div class="flex-1">
                                <label class="block mb-2 font-bold text-sm">Buscar Referencia</label>
                                <p-select [options]="referenciasDisponibles()" [(ngModel)]="selectedRef" [ngModelOptions]="{ standalone: true }" [filter]="true" placeholder="Escriba para buscar..." styleClass="w-full"></p-select>
                            </div>
                            <p-button icon="pi pi-plus" label="Agregar" (onClick)="addReferencia()"></p-button>
                        </div>
                    </div>

                    <p-table [value]="referenciasArray.controls" styleClass="p-datatable-sm">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Referencia</th>
                                <th style="width: 150px">Cantidad</th>
                                <th style="width: 200px">Costo unitario</th>
                                <th style="width: 200px">Total</th>
                                <th style="width: 50px"></th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-control let-i="rowIndex">
                            <tr [formGroup]="control">
                                <td>{{ getReferenciaLabel(control.get('referencia_id')?.value) }}</td>
                                <td>
                                    <p-inputnumber formControlName="cantidad" [min]="1" (onInput)="calculateTotal(i)" styleClass="w-full"></p-inputnumber>
                                </td>
                                <td>
                                    <p-inputnumber formControlName="valor_unitario" mode="currency" currency="COP" [min]="0" (onInput)="calculateTotal(i)" styleClass="w-full"></p-inputnumber>
                                </td>
                                <td class="font-bold">
                                    {{ control.get('valor_total')?.value | currency: 'COP' : 'symbol' : '1.0-0' }}
                                </td>
                                <td>
                                    <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeReferencia(i)"></p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="footer">
                            <tr>
                                <td colspan="3" class="text-right font-bold text-lg">Total Orden:</td>
                                <td class="text-lg font-bold text-primary">{{ totalOrden() | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                <td></td>
                            </tr>
                        </ng-template>
                    </p-table>
                </p-card>
            </form>
        </div>
    `,
    styles: []
})
export class CreateComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly terceroService = inject(TerceroService);
    private readonly pedidoService = inject(PedidoService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly destroy$ = new Subject<void>();

    ordenCompraForm!: FormGroup;
    loading = toSignal(this.store.select(OrdenesCompraSelectors.selectOrdenesCompraLoading), { initialValue: false });

    proveedores = signal<any[]>([]);
    pedidos = signal<any[]>([]);
    referenciasDisponibles = signal<any[]>([]);
    selectedRef: number | null = null;

    estadosOptions = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En proceso', value: 'En proceso' },
        { label: 'Entregado', value: 'Entregado' }
    ];

    coloresOptions = [
        { label: 'Amarillo', value: '#FFFF00' },
        { label: 'Verde', value: '#00ff00' },
        { label: 'Rojo', value: '#ff0000' }
    ];

    totalOrden = signal(0);

    ngOnInit(): void {
        this.initForm();
        this.loadOptions();
    }

    get referenciasArray() {
        return this.ordenCompraForm.get('referencias') as FormArray;
    }

    private initForm(): void {
        this.ordenCompraForm = this.fb.group({
            proveedor_id: [null, [Validators.required]],
            pedido_id: [null],
            fecha_expedicion: [new Date().toISOString().split('T')[0], [Validators.required]],
            fecha_entrega: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], [Validators.required]],
            estado: ['Pendiente'],
            color: ['#FFFF00'],
            observaciones: [''],
            direccion: [''],
            telefono: [''],
            guia: [''],
            referencias: this.fb.array([], Validators.required)
        });
    }

    private loadOptions(): void {
        this.terceroService.list({ per_page: 200, es_proveedor: true }).subscribe((res: PaginatedResponse<any>) => {
            this.proveedores.set(res.data.map((t: any) => ({ label: t.nombre, value: t.id })));
        });

        this.pedidoService.list({ per_page: 200 }).subscribe((res: PaginatedResponse<any>) => {
            this.pedidos.set(res.data.map((p: any) => ({ label: `Pedido #${p.id} - ${p.tercero?.nombre || 'N/A'}`, value: p.id })));
        });

        this.referenciaService.getAll({ per_page: 500 }).subscribe((res: PaginatedResponse<Referencia>) => {
            this.referenciasDisponibles.set(
                res.data.map((r: Referencia) => ({
                    label: `${r.referencia} ${r.articulo?.definicion ? '- ' + r.articulo.definicion : ''}`,
                    value: r.id,
                    data: r
                }))
            );
        });
    }

    addReferencia() {
        if (!this.selectedRef) return;

        const refData = this.referenciasDisponibles().find((r) => r.value === this.selectedRef);
        if (!refData) return;

        // Evitar duplicados
        const exists = this.referenciasArray.controls.some((c) => c.get('referencia_id')?.value === this.selectedRef);
        if (exists) {
            this.messageService.add({ severity: 'warn', summary: 'Duplicado', detail: 'Esta referencia ya está en la lista' });
            return;
        }

        const group = this.fb.group({
            referencia_id: [this.selectedRef, Validators.required],
            label: [refData.label],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            valor_unitario: [0, [Validators.required, Validators.min(0)]],
            valor_total: [0]
        });

        this.referenciasArray.push(group);
        this.selectedRef = null;
        this.updateGrandTotal();
    }

    removeReferencia(index: number) {
        this.referenciasArray.removeAt(index);
        this.updateGrandTotal();
    }

    calculateTotal(index: number) {
        const group = this.referenciasArray.at(index);
        const qty = group.get('cantidad')?.value || 0;
        const price = group.get('valor_unitario')?.value || 0;
        group.patchValue({ valor_total: qty * price }, { emitEvent: false });
        this.updateGrandTotal();
    }

    updateGrandTotal() {
        const total = this.referenciasArray.controls.reduce((acc, curr) => acc + (curr.get('valor_total')?.value || 0), 0);
        this.totalOrden.set(total);
    }

    getReferenciaLabel(id: number) {
        return this.referenciasDisponibles().find((r) => r.value === id)?.label || 'N/A';
    }

    onSubmit(): void {
        if (this.ordenCompraForm.invalid) {
            this.ordenCompraForm.markAllAsTouched();
            return;
        }

        const formValue = this.ordenCompraForm.value;
        const data: CreateOrdenCompraDto = {
            ...formValue,
            referencias: formValue.referencias.map((r: any) => ({
                referencia_id: r.referencia_id,
                cantidad: r.cantidad,
                valor_unitario: r.valor_unitario,
                valor_total: r.valor_total
            }))
        };

        this.store.dispatch(createOrdenCompra({ data }));

        this.store
            .select(OrdenesCompraSelectors.selectOrdenesCompraError)
            .pipe(takeUntil(this.destroy$))
            .subscribe((error) => {
                if (!error && !this.loading()) {
                    this.router.navigate(['/app/ordenes-compra']);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onCancel(): void {
        this.router.navigate(['/app/ordenes-compra']);
    }
}
