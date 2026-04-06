import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

import { loadMaquinaById } from '../../../store/maquinas/actions/maquinas.actions';
import { selectMaquinaById } from '../../../store/maquinas/selectors/maquinas.selectors';
import { ESTADO_REVISION_LABELS, Maquina, normalizeEstadoRevision } from '../../../core/models/maquina.model';

/**
 * Componente de detalle de máquina
 */
@Component({
    selector: 'app-maquina-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, DividerModule, TagModule],
    templateUrl: './detail.html'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    maquina$!: Observable<Maquina | null>;
    maquinaId!: number;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.maquinaId = +params['id'];
            this.store.dispatch(loadMaquinaById({ id: this.maquinaId }));
            this.maquina$ = this.store.select(selectMaquinaById(this.maquinaId));
        });
    }

    /**
     * Navega al formulario de edición
     */
    editarMaquina(): void {
        this.router.navigate(['/app/maquinas', this.maquinaId, 'edit']);
    }

    /**
     * Regresa a la lista
     */
    volver(): void {
        this.router.navigate(['/app/maquinas']);
    }

    etiquetaEstadoRevision(m: Maquina): string {
        return ESTADO_REVISION_LABELS[normalizeEstadoRevision(m.estado_revision)];
    }

    severidadEstadoRevision(m: Maquina): 'success' | 'warn' {
        return normalizeEstadoRevision(m.estado_revision) === 'revisado' ? 'success' : 'warn';
    }
}
