import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { loadSistemaById } from '../../../store/sistemas/actions/sistemas.actions';
import { selectSistemaById } from '../../../store/sistemas/selectors/sistemas.selectors';
import { Sistema } from '../../../core/models/sistema.model';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';

/**
 * Componente de detalle de sistema
 */
@Component({
    selector: 'app-sistema-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, CardModule, ButtonModule, DividerModule, TableModule, MultiSelectModule, ToastModule],
    providers: [MessageService],
    templateUrl: './detail.html'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);

    sistema$!: Observable<Sistema | null>;
    sistemaId!: number;

    // Estado para edición de asociaciones
    editandoAsociaciones = signal(false);
    loadingSync = signal(false);
    selectedListaIds: number[] = [];

    // Catálogo de tipos de artículo para el MultiSelect
    readonly tiposArticuloCatalog = toSignal(this.listaService.getAll({ tipo: 'Tipo de Artículo', per_page: 500, sort_by: 'nombre', sort_order: 'asc' }).pipe(map((response) => response.data.map((l) => ({ label: l.nombre, value: l.id })))), {
        initialValue: [] as { label: string; value: number }[]
    });

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.sistemaId = +params['id'];
            this.store.dispatch(loadSistemaById({ id: this.sistemaId }));
            this.sistema$ = this.store.select(selectSistemaById(this.sistemaId));

            this.sistema$.subscribe((sistema) => {
                if (sistema && !this.editandoAsociaciones()) {
                    this.selectedListaIds = (sistema.articulos ?? []).map((a) => a.id);
                }
            });
        });
    }

    toggleEdicion(): void {
        this.editandoAsociaciones.set(!this.editandoAsociaciones());
    }

    guardarAsociaciones(): void {
        this.loadingSync.set(true);
        this.sistemaService.syncTiposArticulo(this.sistemaId, { lista_ids: this.selectedListaIds }).subscribe({
            next: () => {
                this.loadingSync.set(false);
                this.editandoAsociaciones.set(false);
                this.store.dispatch(loadSistemaById({ id: this.sistemaId }));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Tipos de artículo sincronizados correctamente'
                });
            },
            error: () => {
                this.loadingSync.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron sincronizar los tipos de artículo'
                });
            }
        });
    }

    editarSistema(): void {
        this.router.navigate(['/app/sistemas', this.sistemaId, 'edit']);
    }

    volver(): void {
        this.router.navigate(['/app/sistemas']);
    }

    verArticulo(id: number): void {
        this.router.navigate(['/app/listas', id]);
    }
}
