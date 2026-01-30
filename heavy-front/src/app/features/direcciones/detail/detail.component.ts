import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { loadDireccionById } from '../../../store/direcciones/actions/direcciones.actions';
import * as DireccionesSelectors from '../../../store/direcciones/selectors/direcciones.selectors';
import { Direccion } from '../../../core/models/direccion.model';

/**
 * Componente de detalle de dirección
 */
@Component({
    selector: 'app-direccion-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2>Dirección: {{ direccion()?.direccion }}</h2>
                <div class="flex gap-2">
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"> </p-button>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"> </p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando dirección...</p>
                </div>
            } @else if (direccion()) {
                <div class="grid">
                    <div class="col-12">
                        <p-card header="Información General">
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <p><strong>Dirección:</strong> {{ direccion()?.direccion }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>ID:</strong> {{ direccion()?.id }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Tercero:</strong>
                                        @if (direccion()?.tercero) {
                                            {{ direccion()!.tercero!.razon_social || direccion()!.tercero!.nombre_comercial || 'N/A' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Destinatario:</strong> {{ direccion()?.destinatario || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>NIT/CC:</strong> {{ direccion()?.nit_cc || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Ciudad:</strong> {{ direccion()?.ciudad_texto || direccion()?.city?.name || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Teléfono:</strong> {{ direccion()?.telefono || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Forma de Pago:</strong> {{ direccion()?.forma_pago || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Dirección Principal:</strong>
                                        <p-tag [value]="direccion()!.principal ? 'Sí' : 'No'" [severity]="direccion()!.principal ? 'success' : 'secondary'"> </p-tag>
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>País:</strong>
                                        @if (direccion()?.country) {
                                            {{ direccion()!.country!.name || 'N/A' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Transportadora:</strong>
                                        @if (direccion()?.transportadora) {
                                            {{ direccion()!.transportadora!.nombre || 'N/A' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                            </div>
                        </p-card>
                    </div>
                </div>
            } @else {
                <div class="text-center py-8">
                    <p class="text-xl text-gray-500">Dirección no encontrada</p>
                </div>
            }
        </div>
    `,
    styles: []
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    direccion = signal<Direccion | null>(null);
    direccionId = signal<number>(0);
    loading = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.direccionId.set(+id);
            this.loadDireccion(+id);
        }
    }

    private loadDireccion(id: number): void {
        this.store.dispatch(loadDireccionById({ id }));

        this.store.select(DireccionesSelectors.selectDireccionById(id)).subscribe((direccion) => {
            if (direccion) {
                this.direccion.set(direccion);
                this.loading.set(false);
            }
        });
    }

    onEdit(): void {
        this.router.navigate(['/app/direcciones', this.direccionId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/direcciones']);
    }
}
