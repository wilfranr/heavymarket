import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TerceroFormComponent } from '../../../shared/components/tercero-form/tercero-form.component';
import { Tercero } from '../../../core/models/tercero.model';

@Component({
    selector: 'app-tercero-edit',
    standalone: true,
    imports: [CommonModule, CardModule, ToastModule, TerceroFormComponent],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2 class="text-2xl font-bold mb-6">Editar Tercero</h2>
            <app-tercero-form
                [terceroId]="terceroId"
                (onSave)="onTerceroUpdated($event)"
                (onCancel)="onCancel()">
            </app-tercero-form>
        </div>
        <p-toast></p-toast>
    `
})
export class EditComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);

    terceroId: number | null = null;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        this.terceroId = id ? parseInt(id, 10) : null;
    }

    onTerceroUpdated(tercero: Tercero): void {
        this.router.navigate(['/app/terceros']);
    }

    onCancel(): void {
        this.router.navigate(['/app/terceros']);
    }
}
