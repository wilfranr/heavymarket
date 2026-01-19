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
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';

import { Lista, ListaTipo } from '../../../core/models/lista.model';
import { loadListas, deleteLista } from '../../../store/listas/actions/listas.actions';
import { selectAllListas, selectListasLoading } from '../../../store/listas/selectors/listas.selectors';

/**
 * Componente de lista de Listas
 * Muestra tabla con todos los catálogos (marcas, tipos de máquina, etc.)
 */
@Component({
    selector: 'app-listas-list',
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
        SelectModule,
        FormsModule,
        TooltipModule
    ],
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

    listas$!: Observable<Lista[]>;
    loading$!: Observable<boolean>;

    // Filtros
    selectedTipo: ListaTipo | null = null;
    
    tipos: { label: string; value: ListaTipo }[] = [
        { label: 'Marca', value: 'Marca' },
        { label: 'Tipo de Máquina', value: 'Tipo de Máquina' },
        { label: 'Tipo de Artículo', value: 'Tipo de Artículo' },
        { label: 'Unidad de Medida', value: 'Unidad de Medida' },
        { label: 'Tipo de Medida', value: 'Tipo de Medida' },
        { label: 'Nombre de Medida', value: 'Nombre de Medida' },
    ];

    ngOnInit(): void {
        this.store.dispatch(loadListas({}));
        this.listas$ = this.store.select(selectAllListas);
        this.loading$ = this.store.select(selectListasLoading);
    }

    /**
     * Filtra por tipo
     */
    onTipoChange(): void {
        if (this.selectedTipo) {
            this.store.dispatch(loadListas({ tipo: this.selectedTipo }));
        } else {
            this.store.dispatch(loadListas({}));
        }
    }

    /**
     * Navega al detalle de la lista
     */
    verDetalle(lista: Lista): void {
        this.router.navigate(['/listas', lista.id]);
    }

    /**
     * Navega al formulario de edición
     */
    editarLista(lista: Lista): void {
        this.router.navigate(['/listas', lista.id, 'edit']);
    }

    /**
     * Elimina una lista con confirmación
     */
    eliminarLista(lista: Lista): void {
        this.confirmationService.confirm({
            message: `¿Está seguro de eliminar la lista "${lista.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            accept: () => {
                this.store.dispatch(deleteLista({ id: lista.id }));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Lista eliminada correctamente'
                });
            }
        });
    }

    /**
     * Navega al formulario de creación
     */
    crearLista(): void {
        this.router.navigate(['/listas/create']);
    }

    /**
     * Obtiene el severity del tag según el tipo
     */
    getTipoSeverity(tipo: string): string {
        const severityMap: { [key: string]: string } = {
            'Marca': 'success',
            'Tipo de Máquina': 'info',
            'Tipo de Artículo': 'warn',
            'Unidad de Medida': 'secondary',
            'Tipo de Medida': 'help',
            'Nombre de Medida': 'contrast',
        };
        return severityMap[tipo] || 'secondary';
    }
}
