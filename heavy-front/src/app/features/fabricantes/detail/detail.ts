import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { loadFabricanteById } from '../../../store/fabricantes/actions/fabricantes.actions';
import { selectFabricanteById } from '../../../store/fabricantes/selectors/fabricantes.selectors';
import { Fabricante } from '../../../core/models/fabricante.model';

/**
 * Componente de detalle de fabricante
 */
@Component({
    selector: 'app-fabricante-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, DividerModule],
    templateUrl: './detail.html'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    fabricante$!: Observable<Fabricante | null>;
    fabricanteId!: number;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.fabricanteId = +params['id'];
            this.store.dispatch(loadFabricanteById({ id: this.fabricanteId }));
            this.fabricante$ = this.store.select(selectFabricanteById(this.fabricanteId));
        });
    }

    /**
     * Navega al formulario de edición
     */
    editarFabricante(): void {
        this.router.navigate(['/fabricantes', this.fabricanteId, 'edit']);
    }

    /**
     * Regresa a la lista
     */
    volver(): void {
        this.router.navigate(['/fabricantes']);
    }
}
