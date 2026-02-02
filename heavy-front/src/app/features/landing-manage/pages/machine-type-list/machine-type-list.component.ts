import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { LandingManageService, CategoriaLanding } from '../../services/landing-manage.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-machine-type-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ToastModule,
        TooltipModule,
        SelectModule
    ],
    providers: [MessageService],
    templateUrl: './machine-type-list.component.html'
})
export class MachineTypeListComponent implements OnInit {
    categories = signal<CategoriaLanding[]>([]);
    allCategories = signal<CategoriaLanding[]>([]); // To used for re-assigning
    loading = signal<boolean>(false);

    // Expanded rows map
    expandedRows: { [key: string]: boolean } = {};

    constructor(
        private landingService: LandingManageService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        this.loadCategories();
    }

    loadCategories() {
        this.loading.set(true);
        this.landingService.getAdminMachineTypes()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => {
                    this.categories.set(data);
                    // Filter down to just the parent categories for the dropdown selection
                    this.allCategories.set(data.map(c => ({ ...c, children: [] })));
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los tipos de máquina.' });
                }
            });
    }

    toggleRow(category: CategoriaLanding) {
        const id = category.id.toString();
        const newExpandedRows = { ...this.expandedRows };
        if (newExpandedRows[id]) {
            delete newExpandedRows[id];
        } else {
            newExpandedRows[id] = true;
        }
        this.expandedRows = newExpandedRows;
    }

    onParentChange(machineType: any, newParentId: number) {
        this.landingService.updateLista(machineType.id, {
            parent_id: newParentId
        }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Máquina "${machineType.nombre}" re-categorizada.` });
                this.loadCategories(); // Reload to show in new category
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar la categoría.' });
            }
        });
    }
}
