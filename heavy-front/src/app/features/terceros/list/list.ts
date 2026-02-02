import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

import { Tercero } from '../../../core/models/tercero.model';
import { loadTerceros, deleteTercero } from '../../../store/terceros/actions/terceros.actions';
import { selectAllTerceros, selectTercerosLoading } from '../../../store/terceros/selectors/terceros.selectors';
import { TerceroCreateModalComponent } from '../../../shared/components/tercero-create-modal/tercero-create-modal.component';

/**
 * Componente de lista de terceros
 * Muestra tabla con todos los terceros (clientes y proveedores)
 */
@Component({
    selector: 'app-terceros-list',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TableModule,
        ButtonModule,
        CardModule,
        InputTextModule,
        TagModule,
        ToastModule,
        ConfirmDialogModule,
        TerceroCreateModalComponent,
        IconFieldModule,
        InputIconModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './list.html',
    styleUrl: './list.scss'
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    // Router no longer needed for editing/viewing but kept if needed for other navs or remove
    // private readonly router = inject(Router); 
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    terceros$!: Observable<Tercero[]>;
    loading$!: Observable<boolean>;

    displayCreateTerceroDialog = false;
    selectedTercero: Tercero | null = null;
    isViewMode = false;

    ngOnInit(): void {
        this.loadTerceros();
        this.terceros$ = this.store.select(selectAllTerceros);
        this.loading$ = this.store.select(selectTercerosLoading);
    }

    loadTerceros(): void {
        this.store.dispatch(loadTerceros({}));
    }

    /**
     * Abre el modal en modo visualización
     */
    viewDetail(tercero: Tercero): void {
        this.selectedTercero = tercero;
        this.isViewMode = true;
        this.displayCreateTerceroDialog = true;
    }

    /**
     * Abre el modal en modo edición
     */
    editTercero(tercero: Tercero): void {
        this.selectedTercero = tercero;
        this.isViewMode = false;
        this.displayCreateTerceroDialog = true;
    }

    /**
     * Abre el modal de creación
     */
    crearTercero(): void {
        this.selectedTercero = null;
        this.isViewMode = false;
        this.displayCreateTerceroDialog = true;
    }

    /**
     * Elimina un tercero con confirmación
     */
    eliminarTercero(tercero: Tercero): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar a ${tercero.nombre}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteTercero({ id: tercero.id }));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Tercero eliminado correctamente'
                });
            }
        });
    }

    /**
     * Maneja la creación/edición exitosa
     */
    onTerceroCreated(tercero: any): void {
        this.displayCreateTerceroDialog = false;
        this.loadTerceros();
    }

    /**
     * Obtiene el color del tag según el tipo
     */
    getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' {
        const severityMap: Record<string, 'success' | 'info' | 'warn'> = {
            'Cliente': 'success',
            'Proveedor': 'info',
            'Ambos': 'warn',
            'cliente': 'success',
            'proveedor': 'info',
            'ambos': 'warn'
        };
        return severityMap[tipo] || 'info';
    }

    /**
     * Obtiene el color del tag según el estado
     */
    getEstadoSeverity(estado: string): 'success' | 'danger' {
        return (estado === 'activo' || estado === 'Activo') ? 'success' : 'danger';
    }
}
