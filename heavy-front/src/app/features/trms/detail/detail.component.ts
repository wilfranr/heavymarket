import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { loadTRMById } from '../../../store/trms/actions/trms.actions';
import * as TRMsSelectors from '../../../store/trms/selectors/trms.selectors';
import { TRM } from '../../../core/models/trm.model';

/**
 * Componente de detalle de TRM
 */
@Component({
    selector: 'app-trm-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2>
                    @if (trm()) {
                        TRM: \${{ trm()!.trm | number: '1.2-2' }}
                    } @else {
                        TRM
                    }
                </h2>
                <div class="flex gap-2">
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"> </p-button>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"> </p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando TRM...</p>
                </div>
            } @else if (trm()) {
                <div class="grid">
                    <div class="col-12">
                        <p-card header="Información de la TRM">
                            <div class="grid">
                                @if (trm()) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>ID:</strong> {{ trm()!.id }}</p>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <p>
                                            <strong>TRM (USD/COP):</strong>
                                            <span class="text-2xl font-bold text-primary ml-2"> \${{ trm()!.trm | number: '1.2-2' }} </span>
                                        </p>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <p><strong>Fecha de Creación:</strong> {{ trm()!.created_at | date: 'full' }}</p>
                                    </div>
                                    <div class="col-12 md:col-6">
                                        <p><strong>Última Actualización:</strong> {{ trm()!.updated_at | date: 'full' }}</p>
                                    </div>
                                }
                            </div>
                        </p-card>
                    </div>
                </div>
            } @else {
                <div class="text-center py-8">
                    <p class="text-xl text-gray-500">TRM no encontrada</p>
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

    trm = signal<TRM | null>(null);
    trmId = signal<number>(0);
    loading = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.trmId.set(+id);
            this.loadTRM(+id);
        }
    }

    private loadTRM(id: number): void {
        this.store.dispatch(loadTRMById({ id }));

        this.store.select(TRMsSelectors.selectTRMById(id)).subscribe((trm) => {
            if (trm) {
                this.trm.set(trm);
                this.loading.set(false);
            }
        });
    }

    onEdit(): void {
        this.router.navigate(['/app/trms', this.trmId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/trms']);
    }
}
