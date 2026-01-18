import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-ordenes-compra-list',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="container mx-auto p-4">
            <p-card>
                <ng-template pTemplate="header">
                    <h2 class="text-2xl font-bold p-4">Órdenes de Compra</h2>
                </ng-template>
                <p>Módulo de Órdenes de Compra - En desarrollo</p>
            </p-card>
        </div>
    `
})
export class ListComponent {}
