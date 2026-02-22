import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';

import { loadSistemaById } from '../../../store/sistemas/actions/sistemas.actions';
import { selectSistemaById } from '../../../store/sistemas/selectors/sistemas.selectors';
import { Sistema } from '../../../core/models/sistema.model';

/**
 * Componente de detalle de sistema
 */
@Component({
    selector: 'app-sistema-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, DividerModule, TableModule],
    templateUrl: './detail.html'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    sistema$!: Observable<Sistema | null>;
    sistemaId!: number;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.sistemaId = +params['id'];
            this.store.dispatch(loadSistemaById({ id: this.sistemaId }));
            this.sistema$ = this.store.select(selectSistemaById(this.sistemaId));
        });
    }

    /**
     * Navega al formulario de edición
     */
    editarSistema(): void {
        this.router.navigate(['/app/sistemas', this.sistemaId, 'edit']);
    }

    /**
     * Regresa a la lista
     */
    volver(): void {
        this.router.navigate(['/app/sistemas']);
    }

    /**
     * Navega al detalle del artículo / lista
     */
    verArticulo(id: number): void {
        this.router.navigate(['/app/listas', id]);
    }
}
