import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { Country } from '../../../core/models/ubicacion.model';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-countries-list',
    standalone: true,
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, ToastModule, DatePipe],
    providers: [MessageService],
    template: `
        <div class="p-4">
            <div class="flex justify-between items-center mb-4">
                <h1 class="text-2xl font-bold">Gestión de Países</h1>
            </div>

            <p-toast />

            <div class="mb-4">
                <input pInputText type="text" (input)="applyFilter($event)" placeholder="Buscar país..." class="w-full md:w-80" />
            </div>

            <p-table [value]="countries()" [paginator]="true" [rows]="20" [rowsPerPageOptions]="[10, 20, 50]" [loading]="loading()" responsiveLayout="scroll" [tableStyle]="{ 'min-width': '50rem' }">
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="id">ID <p-sortIcon field="id"></p-sortIcon></th>
                        <th pSortableColumn="name">País <p-sortIcon field="name"></p-sortIcon></th>
                        <th pSortableColumn="iso2">Código <p-sortIcon field="iso2"></p-sortIcon></th>
                        <th pSortableColumn="flete">Flete (USD/lb) <p-sortIcon field="flete"></p-sortIcon></th>
                        <th pSortableColumn="updated_at">Modificado <p-sortIcon field="updated_at"></p-sortIcon></th>
                        <th>Acciones</th>
                    </tr>
                </ng-template>
                <ng-template #body let-country>
                    <tr>
                        <td>{{ country.id }}</td>
                        <td>{{ country.name }}</td>
                        <td>{{ country.iso2 }}</td>
                        <td>
                            <span [class.text-green-600]="country.flete" [class.font-semibold]="country.flete">
                                {{ country.flete ? country.flete + ' USD/lb' : 'Sin configurar' }}
                            </span>
                        </td>
                        <td>{{ country.updated_at | date: 'short' }}</td>
                        <td>
                            <p-button icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="success" [routerLink]="[country.id, 'edit']" pTooltip="Editar flete" />
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class ListComponent implements OnInit {
    private ubicacionService = inject(UbicacionService);
    private router = inject(Router);
    private messageService = inject(MessageService);

    countries = signal<Country[]>([]);
    loading = signal(false);

    ngOnInit(): void {
        this.loadCountries();
    }

    loadCountries(): void {
        this.loading.set(true);
        this.ubicacionService.getCountriesAdmin({ per_page: 100 }).subscribe({
            next: (response) => {
                this.countries.set(response.data);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error cargando países', err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los países'
                });
                this.loading.set(false);
            }
        });
    }

    applyFilter(event: Event): void {
        const input = event.target as HTMLInputElement;
        const filterValue = input.value.toLowerCase();
        this.ubicacionService.getCountriesAdmin({ per_page: 100, search: filterValue }).subscribe({
            next: (response) => this.countries.set(response.data)
        });
    }
}
