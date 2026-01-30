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
import { TRM } from '../../../core/models/trm.model';
import * as TRMsActions from '../../../store/trms/actions/trms.actions';
import * as TRMsSelectors from '../../../store/trms/selectors/trms.selectors';

/**
 * Componente de Lista de TRM
 */
@Component({
    selector: 'app-trms-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, TableModule, ButtonModule, InputTextModule, ConfirmDialogModule],
    providers: [ConfirmationService, MessageService],
    template: `
        <div class="card">
            <h2>Gestión de TRM (Tasa Representativa del Mercado)</h2>

            <!-- Acciones -->
            <div class="mb-4">
                <div class="flex justify-content-end mb-3">
                    <div class="flex gap-2">
                        <p-button label="Nueva TRM" icon="pi pi-plus" (onClick)="onCreateTRM()"> </p-button>
                    </div>
                </div>
            </div>

            <!-- Tabla de TRM -->
            <p-table [value]="trms()" [loading]="loading()" [paginator]="true" [rows]="15" [totalRecords]="total()" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>TRM (USD/COP)</th>
                        <th>Fecha de Creación</th>
                        <th>Última Actualización</th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>

                <ng-template pTemplate="body" let-trm>
                    <tr>
                        <td>
                            <strong class="text-xl">\${{ trm.trm | number: '1.2-2' }}</strong>
                        </td>
                        <td>{{ trm.created_at | date: 'short' }}</td>
                        <td>{{ trm.updated_at | date: 'short' }}</td>
                        <td>
                            <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="onViewTRM(trm.id)"> </p-button>
                            <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="warn" (onClick)="onEditTRM(trm.id)"> </p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="onDeleteTRM(trm)"> </p-button>
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
    trms = signal<TRM[]>([]);
    loading = signal(false);
    total = signal(0);

    ngOnInit() {
        // Cargar TRMs inicial
        this.loadTRMs();

        // Suscribirse al store
        this.store.select(TRMsSelectors.selectAllTRMs).subscribe((trms) => {
            this.trms.set(trms);
        });

        this.store.select(TRMsSelectors.selectTRMsLoading).subscribe((loading) => {
            this.loading.set(loading);
        });

        this.store.select(TRMsSelectors.selectTRMsTotal).subscribe((total) => {
            this.total.set(total);
        });
    }

    loadTRMs(params: any = {}) {
        this.store.dispatch(TRMsActions.loadTRMs(params));
    }

    onCreateTRM() {
        this.router.navigate(['/app/trms/create']);
    }

    onViewTRM(id: number) {
        this.router.navigate(['/app/trms', id]);
    }

    onEditTRM(id: number) {
        this.router.navigate(['/app/trms', id, 'edit']);
    }

    onDeleteTRM(trm: TRM) {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la TRM de $${trm.trm.toFixed(2)}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.store.dispatch(TRMsActions.deleteTRM({ id: trm.id }));
            }
        });
    }
}
