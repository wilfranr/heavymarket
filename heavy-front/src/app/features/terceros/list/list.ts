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

import { Tercero } from '../../../core/models/tercero.model';
import { loadTerceros, deleteTercero } from '../../../store/terceros/actions/terceros.actions';
import { selectAllTerceros, selectTercerosLoading } from '../../../store/terceros/selectors/terceros.selectors';

/**
 * Componente de lista de terceros
 * Muestra tabla con todos los terceros (clientes y proveedores)
 */
@Component({
    selector: 'app-terceros-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, CardModule, InputTextModule, TagModule, ToastModule, ConfirmDialogModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './list.html',
    styleUrl: './list.scss'
})
export class ListComponent implements OnInit {
    @ViewChild('dt') dt!: Table;

    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    terceros$!: Observable<Tercero[]>;
    loading$!: Observable<boolean>;

    ngOnInit(): void {
        this.store.dispatch(loadTerceros({}));
        this.terceros$ = this.store.select(selectAllTerceros);
        this.loading$ = this.store.select(selectTercerosLoading);
    }

    /**
     * Navega al detalle del tercero
     */
    verDetalle(tercero: Tercero): void {
        this.router.navigate(['/app/terceros', tercero.id]);
    }

    /**
     * Navega al formulario de edición
     */
    editarTercero(tercero: Tercero): void {
        this.router.navigate(['/app/terceros', tercero.id, 'edit']);
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
     * Navega al formulario de creación
     */
    crearTercero(): void {
        this.router.navigate(['/app/terceros/create']);
    }

    /**
     * Obtiene el color del tag según el tipo
     */
    getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' {
        const severityMap: Record<string, 'success' | 'info' | 'warn'> = {
            cliente: 'success',
            proveedor: 'info',
            ambos: 'warn'
        };
        return severityMap[tipo] || 'info';
    }

    /**
     * Obtiene el color del tag según el estado
     */
    getEstadoSeverity(estado: string): 'success' | 'danger' {
        return estado === 'activo' ? 'success' : 'danger';
    }
}
