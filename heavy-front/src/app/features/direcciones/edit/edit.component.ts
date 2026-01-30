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
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateDireccion, loadDireccionById } from '../../../store/direcciones/actions/direcciones.actions';
import * as DireccionesSelectors from '../../../store/direcciones/selectors/direcciones.selectors';
import { UpdateDireccionDto } from '../../../core/models/direccion.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { Country, State, City } from '../../../core/models/ubicacion.model';

/**
 * Componente de edición de dirección
 */
@Component({
    selector: 'app-direccion-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToggleSwitchModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2>Editar Dirección</h2>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando dirección...</p>
                </div>
            } @else if (direccionForm) {
                <form [formGroup]="direccionForm" (ngSubmit)="onSubmit()">
                    <div class="grid">
                        <div class="col-12 md:col-6">
                            <label for="tercero_id" class="block mb-2">Tercero</label>
                            <p-select formControlName="tercero_id" [options]="terceros" optionLabel="label" optionValue="value" placeholder="Seleccione un tercero" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12">
                            <label for="direccion" class="block mb-2">Dirección</label>
                            <textarea formControlName="direccion" pTextarea placeholder="Dirección física completa" rows="3" styleClass="w-full"> </textarea>
                        </div>

                        <div class="col-12 md:col-4">
                            <label for="country_id" class="block mb-2">País</label>
                            <p-select formControlName="country_id" [options]="paises" optionLabel="name" optionValue="id" placeholder="Seleccione un país" [filter]="true" [showClear]="true" (onChange)="onPaisChange()" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-4">
                            <label for="state_id" class="block mb-2">Departamento/Estado</label>
                            <p-select formControlName="state_id" [options]="departamentos" optionLabel="name" optionValue="id" placeholder="Seleccione un departamento" [filter]="true" [showClear]="true" (onChange)="onDepartamentoChange()" [disabled]="!direccionForm.get('country_id')?.value" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-4">
                            <label for="city_id" class="block mb-2">Ciudad</label>
                            <p-select formControlName="city_id" [options]="ciudades" optionLabel="name" optionValue="id" placeholder="Seleccione una ciudad" [filter]="true" [showClear]="true" [disabled]="!direccionForm.get('state_id')?.value && !direccionForm.get('country_id')?.value" styleClass="w-full"> </p-select>
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="destinatario" class="block mb-2">Destinatario</label>
                            <input type="text" formControlName="destinatario" pInputText placeholder="Nombre del destinatario" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="nit_cc" class="block mb-2">NIT/CC</label>
                            <input type="text" formControlName="nit_cc" pInputText placeholder="NIT o CC del destinatario" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="telefono" class="block mb-2">Teléfono</label>
                            <input type="text" formControlName="telefono" pInputText placeholder="Teléfono de contacto" styleClass="w-full" />
                        </div>

                        <div class="col-12 md:col-6">
                            <label for="forma_pago" class="block mb-2">Forma de Pago</label>
                            <input type="text" formControlName="forma_pago" pInputText placeholder="Forma de pago" styleClass="w-full" />
                        </div>

                        <div class="col-12">
                            <label for="principal" class="block mb-2">Dirección Principal</label>
                            <p-toggleSwitch formControlName="principal"></p-toggleSwitch>
                            <label class="ml-2">{{ direccionForm.get('principal')?.value ? 'Sí' : 'No' }}</label>
                        </div>
                    </div>

                    <div class="flex justify-content-end gap-2 mt-4">
                        <p-button label="Cancelar" severity="secondary" icon="pi pi-times" type="button" [outlined]="true" (onClick)="onCancel()"> </p-button>
                        <p-button label="Actualizar Dirección" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="direccionForm.invalid"> </p-button>
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
    private readonly terceroService = inject(TerceroService);
    private readonly ubicacionService = inject(UbicacionService);

    direccionForm!: FormGroup;
    direccionId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);
    terceros: any[] = [];
    paises: Country[] = [];
    departamentos: State[] = [];
    ciudades: City[] = [];

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        this.loadPaises();
        this.loadTerceros();

        if (id) {
            this.direccionId.set(+id);
            this.loadDireccion(+id);
        }
    }

    private loadTerceros(): void {
        this.terceroService.list({ per_page: 200 }).subscribe({
            next: (response) => {
                this.terceros = response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id
                }));
            }
        });
    }

    private loadPaises(): void {
        this.ubicacionService.getCountries().subscribe({
            next: (response) => {
                this.paises = response.data;
            }
        });
    }

    private loadDireccion(id: number): void {
        this.store.dispatch(loadDireccionById({ id }));

        this.store.select(DireccionesSelectors.selectDireccionById(id)).subscribe((direccion) => {
            if (direccion) {
                // Cargar ubicaciones dependientes
                if (direccion.country_id) {
                    this.ubicacionService.getStates(direccion.country_id).subscribe((res) => {
                        this.departamentos = res.data;
                        if (direccion.state_id) {
                            this.ubicacionService.getCities(direccion.state_id).subscribe((resCities) => {
                                this.ciudades = resCities.data;
                                // Inicializar form después de cargar dependencias para evitar que se reseteen valores
                                this.initForm(direccion);
                                this.loading.set(false);
                            });
                        } else {
                            this.initForm(direccion);
                            this.loading.set(false);
                        }
                    });
                } else {
                    this.initForm(direccion);
                    this.loading.set(false);
                }
            }
        });

        // También escuchar errores
        this.store.select(DireccionesSelectors.selectDireccionesError).subscribe((error) => {
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

    private initForm(direccion: any): void {
        this.direccionForm = this.fb.group({
            tercero_id: [direccion.tercero_id || ''],
            direccion: [direccion.direccion || ''],
            country_id: [direccion.country_id || null],
            state_id: [direccion.state_id || null],
            city_id: [direccion.city_id || null],
            destinatario: [direccion.destinatario || ''],
            nit_cc: [direccion.nit_cc || ''],
            telefono: [direccion.telefono || ''],
            forma_pago: [direccion.forma_pago || ''],
            principal: [direccion.principal || false]
        });
    }

    onPaisChange(): void {
        const countryId = this.direccionForm.get('country_id')?.value;
        this.departamentos = [];
        this.ciudades = [];
        this.direccionForm.patchValue({ state_id: null, city_id: null });

        if (countryId) {
            this.ubicacionService.getStates(countryId).subscribe({
                next: (response) => {
                    this.departamentos = response.data;
                    if (this.departamentos.length === 0) {
                        this.loadCiudades(undefined, countryId);
                    }
                }
            });
        }
    }

    onDepartamentoChange(): void {
        const stateId = this.direccionForm.get('state_id')?.value;
        this.ciudades = [];
        this.direccionForm.patchValue({ city_id: null });

        if (stateId) {
            this.loadCiudades(stateId);
        }
    }

    private loadCiudades(stateId?: number, countryId?: number): void {
        this.ubicacionService.getCities(stateId, countryId).subscribe({
            next: (response) => {
                this.ciudades = response.data;
            }
        });
    }

    onSubmit(): void {
        if (this.direccionForm.invalid) {
            this.markFormGroupTouched(this.direccionForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.saving.set(true);

        const formValue = this.direccionForm.value;
        const data: UpdateDireccionDto = {
            tercero_id: formValue.tercero_id || undefined,
            direccion: formValue.direccion || undefined,
            country_id: formValue.country_id || null,
            state_id: formValue.state_id || null,
            city_id: formValue.city_id || null,
            destinatario: formValue.destinatario || null,
            nit_cc: formValue.nit_cc || null,
            telefono: formValue.telefono || null,
            forma_pago: formValue.forma_pago || null,
            principal: formValue.principal || false
        };

        this.store.dispatch(updateDireccion({ id: this.direccionId(), data }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.direcciones)
            .subscribe((direccionesState: any) => {
                if (!direccionesState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (direccionesState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: direccionesState.error
                        });
                    } else {
                        this.router.navigate(['/app/direcciones', this.direccionId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/direcciones', this.direccionId()]);
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
