import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateOrdenCompra, loadOrdenCompraById } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { UpdateOrdenCompraDto, OrdenCompraEstado, OrdenCompraColor } from '../../../core/models/orden-compra.model';

/**
 * Componente de edición de orden de compra
 */
@Component({
    selector: 'app-orden-compra-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Editar Orden de Compra OC-{{ ordenCompraId() }}</h2>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando orden de compra...</p>
                </div>
            } @else if (ordenCompraForm) {
                <form [formGroup]="ordenCompraForm" (ngSubmit)="onSubmit()">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="estado" class="block mb-2">Estado</label>
                            <p-select formControlName="estado" [options]="estadosOptions" placeholder="Seleccione un estado" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="color" class="block mb-2">Color</label>
                            <p-select formControlName="color" [options]="coloresOptions" placeholder="Seleccione un color" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="fecha_expedicion" class="block mb-2">Fecha de Expedición</label>
                            <input type="date" formControlName="fecha_expedicion" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="fecha_entrega" class="block mb-2">Fecha de Entrega</label>
                            <input type="date" formControlName="fecha_entrega" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                        </div>

                        <div class="col-12">
                            <label for="observaciones" class="block mb-2">Observaciones</label>
                            <textarea formControlName="observaciones" pInputTextarea rows="4" placeholder="Observaciones adicionales..." styleClass="w-full"> </textarea>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="direccion" class="block mb-2">Dirección</label>
                            <input type="text" formControlName="direccion" pInputText placeholder="Dirección de entrega" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="telefono" class="block mb-2">Teléfono</label>
                            <input type="text" formControlName="telefono" pInputText placeholder="Teléfono de contacto" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="guia" class="block mb-2">Guía</label>
                            <input type="text" formControlName="guia" pInputText placeholder="Número de guía" styleClass="w-full" />
                        </div>
                    </div>

                    <div class="flex justify-content-end gap-2 mt-4">
                        <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                        <p-button label="Actualizar Orden de Compra" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="ordenCompraForm.invalid"> </p-button>
                    </div>
                </form>
            }
        </div>
        <p-toast></p-toast>
    `,
    styles: []
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    ordenCompraForm!: FormGroup;
    ordenCompraId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);
    minDate = new Date();

    estadosOptions: Array<{ label: string; value: OrdenCompraEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En proceso', value: 'En proceso' },
        { label: 'Entregado', value: 'Entregado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    coloresOptions: Array<{ label: string; value: OrdenCompraColor }> = [
        { label: 'En proceso', value: '#FFFF00' },
        { label: 'Entregado', value: '#00ff00' },
        { label: 'Cancelado', value: '#ff0000' }
    ];

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
                this.initForm(ordenCompra);
                this.loading.set(false);
            }
        });

        // También escuchar errores
        this.store.select(OrdenesCompraSelectors.selectOrdenesCompraError).subscribe((error) => {
            if (error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error
                });
                this.loading.set(false);
            }
        });
    }

    private initForm(ordenCompra: any): void {
        this.ordenCompraForm = this.fb.group({
            estado: [ordenCompra.estado || 'Pendiente'],
            color: [ordenCompra.color || '#FFFF00'],
            fecha_expedicion: [ordenCompra.fecha_expedicion ? new Date(ordenCompra.fecha_expedicion).toISOString().split('T')[0] : null],
            fecha_entrega: [ordenCompra.fecha_entrega ? new Date(ordenCompra.fecha_entrega).toISOString().split('T')[0] : null],
            observaciones: [ordenCompra.observaciones || ''],
            direccion: [ordenCompra.direccion || ''],
            telefono: [ordenCompra.telefono || ''],
            guia: [ordenCompra.guia || '']
        });
    }

    onSubmit(): void {
        if (this.ordenCompraForm.invalid) {
            this.markFormGroupTouched(this.ordenCompraForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.saving.set(true);

        const formValue = this.ordenCompraForm.value;
        const data: UpdateOrdenCompraDto = {
            estado: formValue.estado,
            color: formValue.color,
            fecha_expedicion: formValue.fecha_expedicion ? new Date(formValue.fecha_expedicion).toISOString().split('T')[0] : undefined,
            fecha_entrega: formValue.fecha_entrega ? new Date(formValue.fecha_entrega).toISOString().split('T')[0] : undefined,
            observaciones: formValue.observaciones || undefined,
            direccion: formValue.direccion || undefined,
            telefono: formValue.telefono || undefined,
            guia: formValue.guia || undefined
        };

        this.store.dispatch(updateOrdenCompra({ id: this.ordenCompraId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.ordenesCompra)
            .subscribe((ordenesCompraState: any) => {
                if (!ordenesCompraState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (ordenesCompraState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: ordenesCompraState.error
                        });
                    } else {
                        this.router.navigate(['/app/ordenes-compra', this.ordenCompraId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/ordenes-compra', this.ordenCompraId()]);
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
