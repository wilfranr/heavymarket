import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TerceroFormComponent } from '../../../shared/components/tercero-form/tercero-form.component';
import { Tercero } from '../../../core/models/tercero.model';

@Component({
    selector: 'app-tercero-create',
    standalone: true,
    imports: [CommonModule, CardModule, ToastModule, TerceroFormComponent],
    providers: [MessageService],
    template: `
        <div class="card">
            <h2 class="text-2xl font-bold mb-6">Crear Nuevo Tercero</h2>
            <app-tercero-form
                (onSave)="onTerceroCreated($event)"
                (onCancel)="onCancel()">
            </app-tercero-form>
        </div>
        <p-toast></p-toast>
    `
})
export class CreateComponent {
    private readonly router = inject(Router);

    onTerceroCreated(tercero: Tercero): void {
        this.router.navigate(['/app/terceros']);
    }

    onCancel(): void {
        this.router.navigate(['/app/terceros']);
    }
}
