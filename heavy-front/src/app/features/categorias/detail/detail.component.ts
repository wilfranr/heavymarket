import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { loadCategoriaById } from '../../../store/categorias/actions/categorias.actions';
import * as CategoriasSelectors from '../../../store/categorias/selectors/categorias.selectors';
import { Categoria } from '../../../core/models/categoria.model';

/**
 * Componente de detalle de categoría
 */
@Component({
    selector: 'app-categoria-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TableModule],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2>Categoría: {{ categoria()?.nombre }}</h2>
                <div class="flex gap-2">
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"> </p-button>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"> </p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando categoría...</p>
                </div>
            } @else if (categoria()) {
                <div class="grid">
                    <div class="col-12">
                        <p-card header="Información General">
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <p><strong>Nombre:</strong> {{ categoria()?.nombre }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>ID:</strong> {{ categoria()?.id }}</p>
                                </div>
                            </div>
                        </p-card>
                    </div>

                    <!-- Proveedores -->
                    @if (categoria()?.terceros && categoria()!.terceros!.length > 0) {
                        <div class="col-12">
                            <p-card header="Proveedores Asociados">
                                <p-table [value]="categoria()!.terceros!" styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Razón Social</th>
                                            <th>Email</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-tercero>
                                        <tr>
                                            <td>{{ tercero.id }}</td>
                                            <td>{{ tercero.nombre_comercial || 'N/A' }}</td>
                                            <td>{{ tercero.razon_social || 'N/A' }}</td>
                                            <td>{{ tercero.email || 'N/A' }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-card>
                        </div>
                    }

                    <!-- Referencias -->
                    @if (categoria()?.referencias && categoria()!.referencias!.length > 0) {
                        <div class="col-12">
                            <p-card header="Referencias Asociadas">
                                <p-table [value]="categoria()!.referencias!" styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th>ID</th>
                                            <th>Referencia</th>
                                            <th>Descripción</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-referencia>
                                        <tr>
                                            <td>{{ referencia.id }}</td>
                                            <td>{{ referencia.referencia || 'N/A' }}</td>
                                            <td>{{ referencia.descripcion_especifica || referencia.definicion || 'N/A' }}</td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-card>
                        </div>
                    }
                </div>
            } @else {
                <div class="text-center py-8">
                    <p class="text-xl text-gray-500">Categoría no encontrada</p>
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

    categoria = signal<Categoria | null>(null);
    categoriaId = signal<number>(0);
    loading = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.categoriaId.set(+id);
            this.loadCategoria(+id);
        }
    }

    private loadCategoria(id: number): void {
        this.store.dispatch(loadCategoriaById({ id }));

        this.store.select(CategoriasSelectors.selectCategoriaById(id)).subscribe((categoria) => {
            if (categoria) {
                this.categoria.set(categoria);
                this.loading.set(false);
            }
        });
    }

    onEdit(): void {
        this.router.navigate(['/app/categorias', this.categoriaId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/categorias']);
    }
}
