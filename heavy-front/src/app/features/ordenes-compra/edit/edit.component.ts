import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { updateOrdenCompra, loadOrdenCompraById } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { UpdateOrdenCompraDto, OrdenCompraEstado, OrdenCompraColor, OrdenCompra } from '../../../core/models/orden-compra.model';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { PaginatedResponse } from '../../../core/services/api.service';
import { Referencia } from '../../../core/models/referencia.model';

/**
 * Componente de edición de orden de compra
 */
@Component({
    selector: 'app-orden-compra-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, InputNumberModule, TableModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2 class="m-0">Editar Orden de Compra OC-{{ ordenCompraId() }}</h2>
                <div class="flex gap-2">
                    <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="onCancel()"></p-button>
                    <p-button label="Actualizar Orden" icon="pi pi-save" severity="success" [loading]="saving()" [disabled]="ordenCompraForm.invalid" (onClick)="onSubmit()"></p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    <p class="mt-4">Cargando datos...</p>
                </div>
            } @else {
                <form [formGroup]="ordenCompraForm">
                    <p-card header="Estado y Fechas" styleClass="mb-4">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block mb-2 font-bold">Estado</label>
                                <p-select formControlName="estado" [options]="estadosOptions" styleClass="w-full"></p-select>
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
                            <div>
                                <label class="block mb-2 font-bold">Fecha Expedición</label>
                                <input type="date" formControlName="fecha_expedicion" class="w-full p-inputtext" />
                            </div>
                            <div>
                                <label class="block mb-2 font-bold">Fecha Entrega</label>
                                <input type="date" formControlName="fecha_entrega" class="w-full p-inputtext" />
                            </div>
                        </div>
                    </p-card>

                    <p-card header="Información de Entrega" styleClass="mb-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block mb-2 font-bold">Dirección</label>
                                <input type="text" formControlName="direccion" pInputText class="w-full" />
                            </div>
                            <div>
                                <label class="block mb-2 font-bold">Teléfono</label>
                                <input type="text" formControlName="telefono" pInputText class="w-full" />
                            </div>
                            <div>
                                <label class="block mb-2 font-bold">Número de Guía</label>
                                <input type="text" formControlName="guia" pInputText class="w-full" />
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
                                    <p-select [options]="referenciasDisponibles()" [(ngModel)]="selectedRef" [ngModelOptions]="{ standalone: true }" [filter]="true" placeholder="Agregar referencia..." styleClass="w-full"></p-select>
                                </div>
                                <p-button icon="pi pi-plus" label="Agregar" (onClick)="addReferencia()"></p-button>
                            </div>
                        </div>

                        <p-table [value]="referenciasArray.controls" styleClass="p-datatable-sm">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Referencia</th>
                                    <th style="width: 150px">Cantidad</th>
                                    <th style="width: 200px">V. Unitario</th>
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
            }
        </div>
    `,
    styles: []
})
export class EditComponent implements OnInit, OnDestroy {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly destroy$ = new Subject<void>();

    ordenCompraId = signal<number>(0);
    ordenCompraForm!: FormGroup;

    loading = toSignal(this.store.select(OrdenesCompraSelectors.selectOrdenesCompraLoading), { initialValue: true });
    saving = signal(false);

    referenciasDisponibles = signal<any[]>([]);
    selectedRef: number | null = null;
    totalOrden = signal(0);

    estadosOptions = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En proceso', value: 'En proceso' },
        { label: 'Entregado', value: 'Entregado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    coloresOptions = [
        { label: 'Amarillo', value: '#FFFF00' },
        { label: 'Verde', value: '#00ff00' },
        { label: 'Rojo', value: '#ff0000' }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenCompraId.set(+id);
            this.loadOptions();
            this.loadOrdenCompra(+id);
        }
    }

    get referenciasArray() {
        return this.ordenCompraForm?.get('referencias') as FormArray;
    }

    private loadOrdenCompra(id: number): void {
        this.store.dispatch(loadOrdenCompraById({ id }));

        this.store
            .select(OrdenesCompraSelectors.selectOrdenCompraById(id))
            .pipe(takeUntil(this.destroy$))
            .subscribe((orden) => {
                if (orden) {
                    this.initForm(orden);
                    this.updateGrandTotal();
                }
            });
    }

    private initForm(orden: OrdenCompra): void {
        this.ordenCompraForm = this.fb.group({
            estado: [orden.estado || 'Pendiente'],
            color: [orden.color || '#FFFF00'],
            fecha_expedicion: [orden.fecha_expedicion ? new Date(orden.fecha_expedicion).toISOString().split('T')[0] : null],
            fecha_entrega: [orden.fecha_entrega ? new Date(orden.fecha_entrega).toISOString().split('T')[0] : null],
            observaciones: [orden.observaciones || ''],
            direccion: [orden.direccion || ''],
            telefono: [orden.telefono || ''],
            guia: [orden.guia || ''],
            referencias: this.fb.array([])
        });

        // Cargar referencias existentes
        if (orden.referencias) {
            orden.referencias.forEach((ref) => {
                this.referenciasArray.push(
                    this.fb.group({
                        referencia_id: [ref.referencia_id, Validators.required],
                        cantidad: [ref.cantidad, [Validators.required, Validators.min(1)]],
                        valor_unitario: [ref.valor_unitario, [Validators.required, Validators.min(0)]],
                        valor_total: [ref.valor_total]
                    })
                );
            });
        }
    }

    private loadOptions(): void {
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

        const exists = this.referenciasArray.controls.some((c) => c.get('referencia_id')?.value === this.selectedRef);
        if (exists) {
            this.messageService.add({ severity: 'warn', summary: 'Duplicado', detail: 'Esta referencia ya está en la lista' });
            return;
        }

        const group = this.fb.group({
            referencia_id: [this.selectedRef, Validators.required],
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
        return this.referenciasDisponibles().find((r) => r.value === id)?.label || 'Buscando...';
    }

    onSubmit(): void {
        if (this.ordenCompraForm.invalid) {
            this.ordenCompraForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);

        const formValue = this.ordenCompraForm.value;
        const data: UpdateOrdenCompraDto = {
            ...formValue,
            referencias: formValue.referencias.map((r: any) => ({
                referencia_id: r.referencia_id,
                cantidad: r.cantidad,
                valor_unitario: r.valor_unitario,
                valor_total: r.valor_total
            }))
        };

        this.store.dispatch(updateOrdenCompra({ id: this.ordenCompraId(), data }));

        this.store
            .select(OrdenesCompraSelectors.selectOrdenesCompraError)
            .pipe(takeUntil(this.destroy$))
            .subscribe((error) => {
                if (!error && !this.loading()) {
                    this.saving.set(false);
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
