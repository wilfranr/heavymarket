import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createOrdenTrabajo } from '../../../store/ordenes-trabajo/actions/ordenes-trabajo.actions';
import { CreateOrdenTrabajoDto, OrdenTrabajoEstado } from '../../../core/models/orden-trabajo.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';

/**
 * Componente de creación de orden de trabajo
 */
@Component({
    selector: 'app-orden-trabajo-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Crear Orden de Trabajo</h2>

            <form [formGroup]="ordenTrabajoForm" (ngSubmit)="onSubmit()">
                <div class="grid">
                    <div class="col-12 md:col-6">
                        <label for="pedido_id" class="block mb-2">Pedido</label>
                        <p-select formControlName="pedido_id" [options]="pedidos" placeholder="Seleccione un pedido (opcional)" [filter]="true" [showClear]="true" styleClass="w-full"> </p-select>
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="cotizacion_id" class="block mb-2">Cotización</label>
                        <p-select formControlName="cotizacion_id" [options]="cotizaciones" placeholder="Seleccione una cotización (opcional)" [filter]="true" [showClear]="true" styleClass="w-full"> </p-select>
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="fecha_ingreso" class="block mb-2"> Fecha de Ingreso <span class="text-red-500">*</span> </label>
                        <input type="date" formControlName="fecha_ingreso" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                        @if (ordenTrabajoForm.get('fecha_ingreso')?.invalid && ordenTrabajoForm.get('fecha_ingreso')?.touched) {
                            <small class="text-red-500">La fecha de ingreso es requerida</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="fecha_entrega" class="block mb-2">Fecha de Entrega</label>
                        <input type="date" formControlName="fecha_entrega" [min]="minDate.toISOString().split('T')[0]" class="w-full p-inputtext p-component" style="width: 100%" />
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="estado" class="block mb-2">Estado</label>
                        <p-select formControlName="estado" [options]="estadosOptions" placeholder="Seleccione un estado" styleClass="w-full"> </p-select>
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="telefono" class="block mb-2"> Teléfono <span class="text-red-500">*</span> </label>
                        <input type="text" formControlName="telefono" pInputText placeholder="Teléfono de contacto" styleClass="w-full" />
                        @if (ordenTrabajoForm.get('telefono')?.invalid && ordenTrabajoForm.get('telefono')?.touched) {
                            <small class="text-red-500">El teléfono es requerido</small>
                        }
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="transportadora_id" class="block mb-2">Transportadora</label>
                        <p-select formControlName="transportadora_id" [options]="transportadoras" placeholder="Seleccione una transportadora (opcional)" [filter]="true" [showClear]="true" styleClass="w-full"> </p-select>
                    </div>

                    <div class="col-12 md:col-6">
                        <label for="guia" class="block mb-2">Guía</label>
                        <input type="text" formControlName="guia" pInputText placeholder="Número de guía" styleClass="w-full" />
                    </div>

                    <div class="col-12">
                        <label for="observaciones" class="block mb-2">Observaciones</label>
                        <textarea formControlName="observaciones" pInputTextarea rows="4" placeholder="Observaciones adicionales..." styleClass="w-full"> </textarea>
                    </div>
                </div>

                <div class="flex justify-content-end gap-2 mt-4">
                    <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                    <p-button label="Crear Orden de Trabajo" icon="pi pi-check" type="submit" [loading]="loading" [disabled]="ordenTrabajoForm.invalid"> </p-button>
                </div>
            </form>
        </div>
        <p-toast></p-toast>
    `,
    styles: []
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly terceroService = inject(TerceroService);
    private readonly pedidoService = inject(PedidoService);
    private readonly cotizacionService = inject(CotizacionService);

    ordenTrabajoForm!: FormGroup;
    loading = false;
    pedidos: any[] = [];
    cotizaciones: any[] = [];
    transportadoras: any[] = [];
    minDate = new Date();

    estadosOptions: Array<{ label: string; value: OrdenTrabajoEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Proceso', value: 'En Proceso' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadOptions();
    }

    private initForm(): void {
        this.ordenTrabajoForm = this.fb.group({
            pedido_id: [null],
            cotizacion_id: [null],
            tercero_id: [null],
            fecha_ingreso: [null, [Validators.required]],
            fecha_entrega: [null],
            estado: ['Pendiente'],
            direccion_id: [null],
            telefono: ['', [Validators.required]],
            observaciones: [''],
            guia: [''],
            transportadora_id: [null],
            archivo: [''],
            motivo_cancelacion: ['']
        });
    }

    private loadOptions(): void {
        // Cargar pedidos
        this.pedidoService.list({ per_page: 200 }).subscribe({
            next: (response) => {
                this.pedidos = response.data.map((p: any) => ({
                    label: `Pedido #${p.id} - ${p.tercero?.razon_social || 'N/A'}`,
                    value: p.id
                }));
            }
        });

        // Cargar cotizaciones
        this.cotizacionService.getAll({ per_page: 200 }).subscribe({
            next: (response) => {
                this.cotizaciones = response.data.map((c: any) => ({
                    label: `COT-${c.id} - ${c.tercero?.razon_social || 'N/A'}`,
                    value: c.id
                }));
            }
        });

        // TODO: Cargar transportadoras cuando exista el servicio
        // Por ahora dejamos vacío
        this.transportadoras = [];
    }

    onSubmit(): void {
        if (this.ordenTrabajoForm.invalid) {
            this.markFormGroupTouched(this.ordenTrabajoForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.ordenTrabajoForm.value;
        const data: CreateOrdenTrabajoDto = {
            pedido_id: formValue.pedido_id || undefined,
            cotizacion_id: formValue.cotizacion_id || undefined,
            tercero_id: formValue.tercero_id || undefined,
            fecha_ingreso: new Date(formValue.fecha_ingreso).toISOString().split('T')[0],
            fecha_entrega: formValue.fecha_entrega ? new Date(formValue.fecha_entrega).toISOString().split('T')[0] : undefined,
            estado: formValue.estado,
            direccion_id: formValue.direccion_id || undefined,
            telefono: formValue.telefono,
            observaciones: formValue.observaciones || undefined,
            guia: formValue.guia || undefined,
            transportadora_id: formValue.transportadora_id || undefined,
            archivo: formValue.archivo || undefined,
            motivo_cancelacion: formValue.motivo_cancelacion || undefined
        };

        this.store.dispatch(createOrdenTrabajo({ data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.ordenesTrabajo)
            .subscribe((ordenesTrabajoState: any) => {
                if (!ordenesTrabajoState.loading && this.loading) {
                    this.loading = false;
                    subscription.unsubscribe();

                    if (ordenesTrabajoState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: ordenesTrabajoState.error
                        });
                    } else {
                        this.router.navigate(['/app/ordenes-trabajo']);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/ordenes-trabajo']);
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
