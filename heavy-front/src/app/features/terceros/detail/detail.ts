import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TerceroService } from '../../../core/services/tercero.service';
import { Tercero } from '../../../core/models/tercero.model';

import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';

@Component({
    selector: 'app-tercero-detail',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        SkeletonModule,
        ToastModule,
        DialogModule,
        ImageModule
    ],
    // ... rest of metadata
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
            background: var(--surface-50);
            border-radius: 0.5rem;
            border: 1px solid var(--surface-border);
        }
        
        .info-label {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        .info-value {
            font-size: 1rem;
            color: var(--text-color);
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid rgba(234, 179, 8, 0.3);
        }
        
        .contact-card {
            background: var(--surface-50);
            border: 1px solid var(--surface-border);
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

        /* Machine Modal Styles */
        /* Eliminamos overrides agresivos al header/content para respetar el tema claro/oscuro de PrimeNG */
        /* El contenido interno mantendrá su estilo oscuro a través de clases de utilidad */
        
        .machine-table-header {
            background-color: #f59e0b; /* Yellow/Orange */
            color: #000;
            font-weight: bold;
            padding: 0.5rem;
        }
        
        .machine-table-row {
            /* Styles handled by utility classes in HTML for theme support */
        }
        
        .machine-table-cell {
            padding: 1rem;
        }
    `]
})
export class DetailComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly terceroService = inject(TerceroService);
    private readonly messageService = inject(MessageService);

    tercero: Tercero | null = null;
    loading = true;

    // Lógica del modal de máquina
    displayMaquinaDialog = false;
    selectedMaquina: any = null;

    viewMaquina(maquina: any): void {
        this.selectedMaquina = maquina;
        this.displayMaquinaDialog = true;
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadTercero(parseInt(id, 10));
        }
    }

    private loadTercero(id: number): void {
        this.loading = true;
        this.terceroService.getById(id).subscribe({
            next: (response) => {
                this.tercero = response.data;
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la información del tercero'
                });
                this.goBack();
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/app/terceros']);
    }

    editTercero(): void {
        if (this.tercero) {
            this.router.navigate(['/app/terceros', this.tercero.id, 'edit']);
        }
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
