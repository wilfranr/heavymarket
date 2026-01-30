import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { loadEmpresaById } from '../../../store/empresas/actions/empresas.actions';
import * as EmpresasSelectors from '../../../store/empresas/selectors/empresas.selectors';
import { Empresa } from '../../../core/models/empresa.model';

/**
 * Componente de detalle de empresa
 */
@Component({
    selector: 'app-empresa-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2>Empresa: {{ empresa()?.nombre }}</h2>
                <div class="flex gap-2">
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"> </p-button>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"> </p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando empresa...</p>
                </div>
            } @else if (empresa()) {
                <div class="grid">
                    <div class="col-12">
                        <p-card header="Información General">
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <p><strong>Nombre:</strong> {{ empresa()?.nombre }}</p>
                                </div>
                                @if (empresa()?.siglas) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Siglas:</strong> {{ empresa()!.siglas }}</p>
                                    </div>
                                }
                                <div class="col-12 md:col-6">
                                    <p><strong>NIT:</strong> {{ empresa()?.nit }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Email:</strong> {{ empresa()?.email }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Representante:</strong> {{ empresa()?.representante }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Estado:</strong>
                                        @if (empresa()?.estado !== undefined) {
                                            <p-tag [value]="empresa()!.estado ? 'Activa' : 'Inactiva'" [severity]="empresa()!.estado ? 'success' : 'secondary'"> </p-tag>
                                        }
                                    </p>
                                </div>
                                <div class="col-12">
                                    <p><strong>Dirección:</strong> {{ empresa()?.direccion }}</p>
                                </div>
                                @if (empresa()?.telefono) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Teléfono:</strong> {{ empresa()!.telefono }}</p>
                                    </div>
                                }
                                <div class="col-12 md:col-6">
                                    <p><strong>Celular:</strong> {{ empresa()?.celular }}</p>
                                </div>
                                @if (empresa()?.flete) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Flete (por kg):</strong> {{ empresa()!.flete }}</p>
                                    </div>
                                }
                                @if (empresa()?.trm) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>TRM:</strong> {{ empresa()!.trm }}</p>
                                    </div>
                                }
                                @if (empresa()?.country) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>País:</strong> {{ empresa()!.country.name || 'N/A' }}</p>
                                    </div>
                                }
                                @if (empresa()?.city) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Ciudad:</strong> {{ empresa()!.city.name || 'N/A' }}</p>
                                    </div>
                                }
                            </div>
                        </p-card>
                    </div>
                </div>
            } @else {
                <div class="text-center py-8">
                    <p class="text-xl text-gray-500">Empresa no encontrada</p>
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

    empresa = signal<Empresa | null>(null);
    empresaId = signal<number>(0);
    loading = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.empresaId.set(+id);
            this.loadEmpresa(+id);
        }
    }

    private loadEmpresa(id: number): void {
        this.store.dispatch(loadEmpresaById({ id }));

        this.store.select(EmpresasSelectors.selectEmpresaById(id)).subscribe((empresa) => {
            if (empresa) {
                this.empresa.set(empresa);
                this.loading.set(false);
            }
        });
    }

    onEdit(): void {
        this.router.navigate(['/app/empresas', this.empresaId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/empresas']);
    }
}
