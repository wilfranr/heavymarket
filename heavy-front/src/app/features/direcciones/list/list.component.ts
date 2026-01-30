import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Direccion } from '../../../core/models/direccion.model';
import * as DireccionesActions from '../../../store/direcciones/actions/direcciones.actions';
import * as DireccionesSelectors from '../../../store/direcciones/selectors/direcciones.selectors';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de Lista de Direcciones
 */
@Component({
    selector: 'app-direcciones-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, SelectModule, ConfirmDialogModule, TagModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Direcciones</h2>

            <!-- Filtros y Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-between mb-3">
                    <div class="flex gap-2 flex-wrap">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </span>
                        <p-select [(ngModel)]="selectedTercero" [options]="terceros" optionLabel="label" optionValue="value" placeholder="Filtrar por tercero" [showClear]="true" (ngModelChange)="onTerceroChange()" styleClass="w-full md:w-14rem">
                        </p-select>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Nueva Dirección" icon="pi pi-plus" (onClick)="onCreateDireccion()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Direcciones -->
            <p-table [value]="direcciones()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Dirección</th>
                        <th>Tercero</th>
                        <th>Destinatario</th>
                        <th>Ciudad</th>
                        <th>Teléfono</th>
                        <th>Principal</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-direccion>
                    <tr>
                        <td>{{ direccion.direccion }}</td>
                        <td>
                            @if (direccion.tercero) {
                                {{ direccion.tercero.nombre || 'N/A' }}
                            } @else {
                                N/A
                            }
                        </td>
                        <td>{{ direccion.destinatario || 'N/A' }}</td>
                        <td>{{ direccion.ciudad_texto || direccion.city?.name || 'N/A' }}</td>
                        <td>{{ direccion.telefono || 'N/A' }}</td>
                        <td>
                            <p-tag [value]="direccion.principal ? 'Sí' : 'No'" [severity]="direccion.principal ? 'success' : 'secondary'"> </p-tag>
                        </td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewDireccion(direccion.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditDireccion(direccion.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteDireccion(direccion)"> </p-button>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <p-confirmDialog></p-confirmDialog>
    `,
    styles: []
})
export class ListComponent implements OnInit {
    private store = inject(Store);
    private router = inject(Router);
    private confirmationService = inject(ConfirmationService);
    private terceroService = inject(TerceroService);

    // Signals para estado local
    direcciones = signal<Direccion[]>([]);
    loading = signal(false);
    total = signal(0);
    selectedTercero: number | null = null;
    terceros: any[] = [];

    ngOnInit() {
        // Cargar terceros para el filtro
        this.loadTerceros();

        // Cargar direcciones inicial
        this.loadDirecciones();

        // Suscribirse al store
        this.store.select(DireccionesSelectors.selectAllDirecciones).subscribe((direcciones) => {
            this.direcciones.set(direcciones);
        });

        this.store.select(DireccionesSelectors.selectDireccionesLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(DireccionesSelectors.selectDireccionesTotal).subscribe((total) => {
            this.total.set(total);
        });
    }

    private loadTerceros(): void {
        this.terceroService.list({ per_page: 200 }).subscribe({
            next: (response) => {
                this.terceros = [
                    { label: 'Todos', value: null },
                    ...response.data.map((t) => ({
                        label: t.nombre || `Tercero ${t.id}`,
                        value: t.id
                    }))
                ];
            }
        });
    }

    loadDirecciones(params: any = {}) {
        if (this.selectedTercero) {
            params.tercero_id = this.selectedTercero;
        }
        this.store.dispatch(DireccionesActions.loadDirecciones(params));
    }

    onSearch(event: any) {
        const search = event.target.value;
        if (search.length === 0 || search.length >= 3) {
            this.loadDirecciones({ search });
        }
    }

    onTerceroChange() {
        this.loadDirecciones();
    }

    onCreateDireccion() {
        this.router.navigate(['/app/direcciones/create']);
    }

    onViewDireccion(id: number) {
        this.router.navigate(['/app/direcciones', id]);
    }

    onEditDireccion(id: number) {
        this.router.navigate(['/app/direcciones', id, 'edit']);
    }

    onDeleteDireccion(direccion: Direccion) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la dirección "${direccion.direccion}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(DireccionesActions.deleteDireccion({ id: direccion.id }));
            }
        });
    }
}
