import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Transportadora } from '../../../core/models/transportadora.model';
import * as TransportadorasActions from '../../../store/transportadoras/actions/transportadoras.actions';
import * as TransportadorasSelectors from '../../../store/transportadoras/selectors/transportadoras.selectors';

/**
 * Componente de Lista de Transportadoras
 */
@Component({
    selector: 'app-transportadoras-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, ConfirmDialogModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <div class="card">
            <h2>Gestión de Transportadoras</h2>

            <!-- Filtros y Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-between mb-3">
                    <div class="flex gap-2 flex-wrap">
                        <span class="p-input-icon-left">
                            <i class="pi pi-search"></i>
                            <input pInputText type="text" (input)="onSearch($event)" placeholder="Buscar..." />
                        </span>
                    </div>

                    <div class="flex gap-2">
                        <p-button label="Nueva Transportadora" icon="pi pi-plus" (onClick)="onCreateTransportadora()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Transportadoras -->
            <p-table [value]="transportadoras()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Nombre</th>
                        <th>NIT</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-transportadora>
                    <tr>
                        <td>{{ transportadora.nombre }}</td>
                        <td>{{ transportadora.nit || 'N/A' }}</td>
                        <td>{{ transportadora.contacto || 'N/A' }}</td>
                        <td>{{ transportadora.telefono || transportadora.celular || 'N/A' }}</td>
                        <td>{{ transportadora.email || 'N/A' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewTransportadora(transportadora.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditTransportadora(transportadora.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteTransportadora(transportadora)"> </p-button>
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

    // Signals para estado local
    transportadoras = signal<Transportadora[]>([]);
    loading = signal(false);
    total = signal(0);

    ngOnInit() {
        // Cargar transportadoras inicial
        this.loadTransportadoras();

        // Suscribirse al store
        this.store.select(TransportadorasSelectors.selectAllTransportadoras).subscribe((transportadoras) => {
            this.transportadoras.set(transportadoras);
        });

        this.store.select(TransportadorasSelectors.selectTransportadorasLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(TransportadorasSelectors.selectTransportadorasTotal).subscribe((total) => {
            this.total.set(total);
        });
    }

    loadTransportadoras(params: any = {}) {
        this.store.dispatch(TransportadorasActions.loadTransportadoras(params));
    }

    onSearch(event: any) {
        const search = event.target.value;
        if (search.length === 0 || search.length >= 3) {
            this.loadTransportadoras({ search });
        }
    }

    onCreateTransportadora() {
        this.router.navigate(['/app/transportadoras/create']);
    }

    onViewTransportadora(id: number) {
        this.router.navigate(['/app/transportadoras', id]);
    }

    onEditTransportadora(id: number) {
        this.router.navigate(['/app/transportadoras', id, 'edit']);
    }

    onDeleteTransportadora(transportadora: Transportadora) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la transportadora "${transportadora.nombre}"?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(TransportadorasActions.deleteTransportadora({ id: transportadora.id }));
            }
        });
    }
}
