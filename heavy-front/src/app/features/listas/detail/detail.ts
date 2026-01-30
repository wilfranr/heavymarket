import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';

import { loadListaById } from '../../../store/listas/actions/listas.actions';
import { selectListaById } from '../../../store/listas/selectors/listas.selectors';
import { Lista } from '../../../core/models/lista.model';

/**
 * Componente de detalle de lista
 * Muestra la información completa de un catálogo
 */
@Component({
    selector: 'app-lista-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule],
    templateUrl: './detail.html'
    // styleUrl: './detail.scss'
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    lista$!: Observable<Lista | null>;
    listaId!: number;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.listaId = +params['id'];
            this.store.dispatch(loadListaById({ id: this.listaId }));
            this.lista$ = this.store.select(selectListaById(this.listaId));
        });
    }

    /**
     * Navega al formulario de edición
     */
    editarLista(): void {
        this.router.navigate(['/app/listas', this.listaId, 'edit']);
    }

    /**
     * Regresa a la lista
     */
    volver(): void {
        this.router.navigate(['/app/listas']);
    }

    /**
     * Obtiene el severity del tag según el tipo
     */
    getTipoSeverity(tipo: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
        const severityMap: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            Marca: 'success',
            'Tipo de Máquina': 'info',
            'Tipo de Artículo': 'warn',
            'Unidad de Medida': 'secondary',
            'Tipo de Medida': 'info',
            'Nombre de Medida': 'contrast'
        };
        return severityMap[tipo] || 'secondary';
    }
}
