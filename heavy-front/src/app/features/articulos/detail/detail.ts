import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { loadArticuloById } from '../../../store/articulos/actions/articulos.actions';
import { selectArticuloById } from '../../../store/articulos/selectors/articulos.selectors';
import { Articulo } from '../../../core/models/articulo.model';

/**
 * Componente de detalle de artículo
 */
@Component({
    selector: 'app-articulo-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, DividerModule],
    templateUrl: './detail.html'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    articulo$!: Observable<Articulo | null>;
    articuloId!: number;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.articuloId = +params['id'];
            this.store.dispatch(loadArticuloById({ id: this.articuloId }));
            this.articulo$ = this.store.select(selectArticuloById(this.articuloId));
        });
    }

    /**
     * Navega al formulario de edición
     */
    editarArticulo(): void {
        this.router.navigate(['/app/articulos', this.articuloId, 'edit']);
    }

    /**
     * Regresa a la lista
     */
    volver(): void {
        this.router.navigate(['/app/articulos']);
    }
}
