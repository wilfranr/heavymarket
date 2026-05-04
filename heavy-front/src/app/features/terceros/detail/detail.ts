import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MaquinaDetailComponent } from '../../../shared/components/maquina-detail/maquina-detail.component';
import { Tercero } from '../../../core/models/tercero.model';
import { loadTerceroById } from '../../../store/terceros/actions/terceros.actions';
import { selectTerceroById, selectTercerosLoading } from '../../../store/terceros/selectors/terceros.selectors';

@Component({
    selector: 'app-tercero-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        SkeletonModule,
        ToastModule,
        DialogModule,
        TooltipModule,
        MaquinaDetailComponent
    ],
    providers: [MessageService],
    templateUrl: './detail.html',
    styles: [`
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
        }
        
        .info-item {
            padding: 1rem;
            background: var(--p-surface-card);
            border-radius: 0.5rem;
            border: 1px solid var(--p-surface-border);
        }
        
        .info-label {
            font-size: 0.875rem;
            color: var(--p-text-muted-color);
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 1rem;
            color: var(--p-text-color);
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid rgba(234, 179, 8, 0.3);
        }
        
        .contact-card {
            background: var(--p-surface-card);
            border: 1px solid var(--p-surface-border);
            border-radius: 0.5rem;
            padding: 1rem;
        }
        
        .principal-badge {
            background: #eab308;
            color: #000;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: bold;
        }
    `]
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    tercero$!: Observable<Tercero | undefined>;
    loading$!: Observable<boolean>;
    terceroId!: number;

    displayMaquinaDialog = false;
    selectedMaquina: any = null;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.terceroId = +params['id'];
            this.store.dispatch(loadTerceroById({ id: this.terceroId }));
            this.tercero$ = this.store.select(selectTerceroById(this.terceroId));
            this.loading$ = this.store.select(selectTercerosLoading);
        });
    }

    viewMaquina(maquina: any): void {
        this.selectedMaquina = maquina;
        this.displayMaquinaDialog = true;
    }

    goBack(): void {
        this.router.navigate(['/app/terceros']);
    }

    editTercero(): void {
        this.router.navigate(['/app/terceros', this.terceroId, 'edit']);
    }

    getTipoSeverity(tipo: string): 'success' | 'info' | 'warn' {
        const severityMap: Record<string, 'success' | 'info' | 'warn'> = {
            'Cliente': 'success',
            'Proveedor': 'info',
            'Ambos': 'warn'
        };
        return severityMap[tipo] || 'info';
    }

    getEstadoSeverity(estado: string): 'success' | 'danger' {
        return estado?.toLowerCase() === 'activo' ? 'success' : 'danger';
    }
}
