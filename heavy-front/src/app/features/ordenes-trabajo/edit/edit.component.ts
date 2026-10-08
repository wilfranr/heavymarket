import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateOrdenTrabajo, loadOrdenTrabajoById } from '../../../store/ordenes-trabajo/actions/ordenes-trabajo.actions';
import * as OrdenesTrabajoSelectors from '../../../store/ordenes-trabajo/selectors/ordenes-trabajo.selectors';
import { UpdateOrdenTrabajoDto, OrdenTrabajoEstado } from '../../../core/models/orden-trabajo.model';
import { Transportadora } from '../../../core/models/transportadora.model';
import { Direccion } from '../../../core/models/direccion.model';
import { TransportadoraService } from '../../../core/services/transportadora.service';
import { DireccionService } from '../../../core/services/direccion.service';

/**
 * Componente de edición de orden de trabajo
 */
@Component({
    selector: 'app-orden-trabajo-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, DividerModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="px-4 py-8 md:px-6 lg:px-8">
            @if (loading()) {
                <div class="text-center py-12">
                    <i class="pi pi-spin pi-spinner text-4xl text-muted-color"></i>
                    <p class="mt-4 text-muted-color">Cargando orden de trabajo...</p>
                </div>
            } @else if (ordenTrabajoForm) {
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h1 class="text-3xl font-bold text-color m-0">Editar Orden de Trabajo OT-{{ ordenTrabajoId() }}</h1>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" type="button" (onClick)="onCancel()"></p-button>
                </div>

                <form [formGroup]="ordenTrabajoForm" (ngSubmit)="onSubmit()">
                    <div class="card shadow-sm border-round p-6 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Estado</label>
                                <p-select formControlName="estado" [options]="estadosOptions" optionLabel="label" optionValue="value" placeholder="Seleccione un estado" styleClass="w-full"></p-select>
                            </div>

                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Teléfono</label>
                                <input pInputText type="text" formControlName="telefono" placeholder="Teléfono de contacto" class="w-full" />
                            </div>

                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Fecha de Ingreso</label>
                                <input type="date" formControlName="fecha_ingreso" [min]="minDateStr" class="w-full p-inputtext p-component" />
                            </div>

                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Fecha de Entrega</label>
                                <input type="date" formControlName="fecha_entrega" [min]="minDateStr" class="w-full p-inputtext p-component" />
                            </div>

                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Transportadora</label>
                                <p-select formControlName="transportadora_id" [options]="transportadoras()" optionLabel="nombre" optionValue="id" [filter]="true" filterBy="nombre" [showClear]="true" placeholder="Seleccione una transportadora" appendTo="body" styleClass="w-full"></p-select>
                            </div>

                            <div class="field">
                                <label class="block text-sm font-medium mb-2">Guía</label>
                                <input pInputText type="text" formControlName="guia" placeholder="Número de guía" class="w-full" />
                            </div>

                            <div class="field md:col-span-2">
                                <label class="block text-sm font-medium mb-2">Dirección de despacho</label>
                                <p-select formControlName="direccion_id" [options]="direcciones()" optionLabel="direccion" optionValue="id" [filter]="true" [showClear]="true" placeholder="Seleccione una dirección (opcional)" appendTo="body" styleClass="w-full">
                                    <ng-template let-direccion pTemplate="item">{{ direccionLabel(direccion) }}</ng-template>
                                    <ng-template let-direccion pTemplate="selectedItem">{{ direccionLabel(direccion) }}</ng-template>
                                </p-select>
                                @if (direcciones().length === 0) {
                                    <small class="text-muted-color">Este cliente no tiene perfiles de despacho registrados.</small>
                                }
                            </div>

                            <div class="field md:col-span-2">
                                <label class="block text-sm font-medium mb-2">Observaciones</label>
                                <textarea pTextarea formControlName="observaciones" rows="4" placeholder="Observaciones adicionales..." class="w-full"></textarea>
                            </div>

                            @if (ordenTrabajoForm.get('estado')?.value === 'Cancelado') {
                                <div class="field md:col-span-2">
                                    <label class="block text-sm font-medium mb-2">Motivo de Cancelación <span class="text-red-500">*</span></label>
                                    <textarea pTextarea formControlName="motivo_cancelacion" rows="3" placeholder="Motivo de cancelación..." class="w-full"></textarea>
                                </div>
                            }
                        </div>

                        <p-divider />

                        <div class="flex justify-end gap-2">
                            <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" type="button" (onClick)="onCancel()"></p-button>
                            <p-button label="Guardar Cambios" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="ordenTrabajoForm.invalid"></p-button>
                        </div>
                    </div>
                </form>
            }
        </div>
        <p-toast></p-toast>
    `
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly transportadoraService = inject(TransportadoraService);
    private readonly direccionService = inject(DireccionService);

    ordenTrabajoForm!: FormGroup;
    ordenTrabajoId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);
    minDateStr = new Date().toISOString().split('T')[0];

    transportadoras = signal<Transportadora[]>([]);
    direcciones = signal<Direccion[]>([]);

    estadosOptions: Array<{ label: string; value: OrdenTrabajoEstado }> = [
        { label: 'Pendiente', value: 'Pendiente' },
        { label: 'En Proceso', value: 'En Proceso' },
        { label: 'Completado', value: 'Completado' },
        { label: 'Cancelado', value: 'Cancelado' }
    ];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenTrabajoId.set(+id);
            this.loadOrdenTrabajo(+id);
        }

        this.transportadoraService.getAll({ per_page: 200 }).subscribe({
            next: (response) => this.transportadoras.set(response.data)
        });
    }

    private loadOrdenTrabajo(id: number): void {
        this.store.dispatch(loadOrdenTrabajoById({ id }));

        this.store.select(OrdenesTrabajoSelectors.selectOrdenTrabajoById(id)).subscribe((ordenTrabajo) => {
            if (ordenTrabajo) {
                this.initForm(ordenTrabajo);
                this.loading.set(false);

                if (ordenTrabajo.tercero_id) {
                    this.direccionService.getAll({ tercero_id: ordenTrabajo.tercero_id, per_page: 200 }).subscribe({
                        next: (response) => this.direcciones.set(response.data)
                    });
                }
            }
        });

        this.store.select(OrdenesTrabajoSelectors.selectOrdenesTrabajoError).subscribe((error) => {
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

    private initForm(ordenTrabajo: any): void {
        this.ordenTrabajoForm = this.fb.group({
            estado: [ordenTrabajo.estado || 'Pendiente'],
            fecha_ingreso: [ordenTrabajo.fecha_ingreso ? new Date(ordenTrabajo.fecha_ingreso).toISOString().split('T')[0] : null],
            fecha_entrega: [ordenTrabajo.fecha_entrega ? new Date(ordenTrabajo.fecha_entrega).toISOString().split('T')[0] : null],
            telefono: [ordenTrabajo.telefono || ''],
            observaciones: [ordenTrabajo.observaciones || ''],
            guia: [ordenTrabajo.guia || ''],
            transportadora_id: [ordenTrabajo.transportadora_id || null],
            direccion_id: [ordenTrabajo.direccion_id || null],
            motivo_cancelacion: [ordenTrabajo.motivo_cancelacion || '']
        });
    }

    direccionLabel(direccion: Direccion): string {
        const partes = [direccion.destinatario, direccion.ciudad_texto || direccion.city?.name, direccion.direccion].filter((parte) => !!parte);
        return partes.length > 0 ? partes.join(' — ') : `Dirección #${direccion.id}`;
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

        this.saving.set(true);

        const formValue = this.ordenTrabajoForm.value;
        const data: UpdateOrdenTrabajoDto = {
            estado: formValue.estado,
            fecha_ingreso: formValue.fecha_ingreso ? new Date(formValue.fecha_ingreso).toISOString().split('T')[0] : undefined,
            fecha_entrega: formValue.fecha_entrega ? new Date(formValue.fecha_entrega).toISOString().split('T')[0] : undefined,
            telefono: formValue.telefono || undefined,
            observaciones: formValue.observaciones || undefined,
            guia: formValue.guia || undefined,
            transportadora_id: formValue.transportadora_id || undefined,
            direccion_id: formValue.direccion_id || undefined,
            motivo_cancelacion: formValue.motivo_cancelacion || undefined
        };

        this.store.dispatch(updateOrdenTrabajo({ id: this.ordenTrabajoId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.ordenesTrabajo)
            .subscribe((ordenesTrabajoState: any) => {
                if (!ordenesTrabajoState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (ordenesTrabajoState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: ordenesTrabajoState.error
                        });
                    } else {
                        this.router.navigate(['/app/ordenes-trabajo', this.ordenTrabajoId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/ordenes-trabajo', this.ordenTrabajoId()]);
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
