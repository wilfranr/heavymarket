import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { LandingManageService, CategoriaLanding, SubcategoriaLanding } from '../../services/landing-manage.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ToggleSwitchModule,
        InputNumberModule,
        ToastModule,
        TooltipModule
    ],
    providers: [MessageService],
    templateUrl: './category-list.component.html'
})
export class CategoryListComponent implements OnInit {
    categories = signal<CategoriaLanding[]>([]);
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

    toggleRow(category: CategoriaLanding) {
        console.log('toggleRow clicked for:', category.id, category.nombre);
        const id = category.id.toString();
        const newExpandedRows = { ...this.expandedRows };
        if (newExpandedRows[id]) {
            console.log('Collapsing row', id);
            delete newExpandedRows[id];
        } else {
            console.log('Expanding row', id);
            newExpandedRows[id] = true;
        }
        this.expandedRows = newExpandedRows;
        console.log('New expandedRows state:', this.expandedRows);
    }

    loadCategories() {
        this.loading.set(true);
        this.landingService.getAdminCategories()
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
                next: (data) => {
                    this.categories.set(data);
                },
                error: (err) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorías.' });
                }
            });
    }

    onCategoryToggle(category: CategoriaLanding) {
        // Validar límite (optimistic UI o esperar backend)
        // El backend valida, así que si enviamos true y ya hay 5, fallará.

        this.landingService.updateCategory(category.id, {
            mostrar_en_navbar: category.mostrar_en_navbar
        }).subscribe({
            next: (updated) => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Categoría "${updated.nombre}" actualizada.` });
            },
            error: (err) => {
                // Revertir cambio en UI
                category.mostrar_en_navbar = !category.mostrar_en_navbar;

                const msg = err.error?.message || 'Error al actualizar categoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    onCategoryOrderChange(category: CategoriaLanding) {
        this.landingService.updateCategory(category.id, {
            orden_navbar: category.orden_navbar
        }).subscribe({
            next: () => {
                // Silent success or toast
            },
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar orden.' });
            }
        });
    }

    onSubcategoryToggle(subcategory: SubcategoriaLanding) {
        this.landingService.updateSubcategory(subcategory.id, {
            mostrar_en_navbar: subcategory.mostrar_en_navbar
        }).subscribe({
            next: (updated) => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Subcategoría "${updated.nombre}" actualizada.` });
            },
            error: (err) => {
                subcategory.mostrar_en_navbar = !subcategory.mostrar_en_navbar;
                const msg = err.error?.message || 'Error al actualizar subcategoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    onSubcategoryOrderChange(subcategory: SubcategoriaLanding) {
        this.landingService.updateSubcategory(subcategory.id, {
            orden_navbar: subcategory.orden_navbar
        }).subscribe({
            error: (err) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar orden.' });
            }
        });
    }
}
