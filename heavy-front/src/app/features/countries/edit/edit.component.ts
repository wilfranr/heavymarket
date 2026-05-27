import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { Country } from '../../../core/models/ubicacion.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-country-edit',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, InputTextModule, ButtonModule, CardModule, ToastModule],
    providers: [MessageService],
    template: `
        <div class="p-4">
            <p-toast />

            <div class="mb-4">
                <p-button
                    icon="pi pi-arrow-left"
                    label="Volver"
                                [routerLink]="['/app/countries']"
                    [text]="true"
                />
            </div>

            <p-card header="Editar Tarifa de Flete" [style]="{ width: '100%', maxWidth: '600px' }">
                @if (loading()) {
                    <div class="flex justify-center py-8">
                        <p>Cargando información del país...</p>
                    </div>
                } @else if (country()) {
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="block font-semibold mb-2">País</label>
                            <input
                                pInputText
                                [value]="country()?.name"
                                [disabled]="true"
                                class="w-full"
                            />
                        </div>

                        <div>
                            <label class="block font-semibold mb-2">Tarifa de Flete (USD/lb)</label>
                            <input
                                pInputText
                                type="number"
                                [(ngModel)]="flete"
                                placeholder="Ej: 2.5"
                                class="w-full"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                            <small class="text-gray-500">
                                Tarifa en dólares por libra para proveedores internacionales de este país.
                                Dejar vacío si no aplica.
                            </small>
                        </div>

                        <div class="flex gap-2">
                            <p-button
                                label="Guardar"
                                icon="pi pi-check"
                                [loading]="saving()"
                                (onClick)="save()"
                            />
                            <p-button
                                label="Cancelar"
                                icon="pi pi-times"
                                severity="secondary"
                    [routerLink]="['/app/countries']"
                            />
                        </div>
                    </div>
                }
            </p-card>
        </div>
    `
})
export class EditComponent implements OnInit {
    private ubicacionService = inject(UbicacionService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private messageService = inject(MessageService);

    country = signal<Country | null>(null);
    loading = signal(false);
    saving = signal(false);
    flete: number | null = null;

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.loadCountry(id);
    }

    loadCountry(id: number): void {
        this.loading.set(true);
        this.ubicacionService.getCountry(id).subscribe({
            next: (response) => {
                this.country.set(response.data);
                this.flete = response.data.flete ?? null;
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando país', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la información del país'
                });
                this.loading.set(false);
            }
        });
    }

    save(): void {
        if (!this.country()) return;

        this.saving.set(true);
        this.ubicacionService.updateCountry(this.country()!.id, { flete: this.flete }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Tarifa de flete actualizada correctamente'
                });
                this.saving.set(false);
                this.router.navigate(['/app/countries']);
            },
            error: (err) => {
                console.error('Error actualizando flete', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message || 'No se pudo actualizar la tarifa de flete'
                });
                this.saving.set(false);
            }
        });
    }
}
