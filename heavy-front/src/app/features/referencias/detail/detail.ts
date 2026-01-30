import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { loadReferenciaById } from '../../../store/referencias/actions/referencias.actions';
import { selectReferenciaById } from '../../../store/referencias/selectors/referencias.selectors';
import { Referencia } from '../../../core/models/referencia.model';

/**
 * Componente de detalle de referencia
 */
@Component({
    selector: 'app-referencia-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, DividerModule],
    templateUrl: './detail.html'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    referencia$!: Observable<Referencia | null>;
    referenciaId!: number;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.referenciaId = +params['id'];
            this.store.dispatch(loadReferenciaById({ id: this.referenciaId }));
            this.referencia$ = this.store.select(selectReferenciaById(this.referenciaId));
        });
    }

    /**
     * Navega al formulario de edición
     */
    editarReferencia(): void {
        this.router.navigate(['/app/referencias', this.referenciaId, 'edit']);
    }

    /**
     * Regresa a la lista
     */
    volver(): void {
        this.router.navigate(['/app/referencias']);
    }
}
