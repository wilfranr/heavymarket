import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
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
        TooltipModule,
        DialogModule,
        InputTextModule,
        ConfirmDialogModule,
        CheckboxModule,
        DividerModule
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './category-list.component.html'
})
export class CategoryListComponent implements OnInit {
    categories = signal<CategoriaLanding[]>([]);
    loading = signal<boolean>(false);

    expandedRows: { [key: string]: boolean } = {};

    categoryDialog: boolean = false;
    currentCategory: Partial<CategoriaLanding> = {};
    isEditingCategory: boolean = false;

    subcategoryDialog: boolean = false;
    currentSubcategory: Partial<SubcategoriaLanding> = {};
    isEditingSubcategory: boolean = false;

    constructor(
        private landingService: LandingManageService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) { }

    ngOnInit() {
        this.loadCategories();
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

    openNewCategory() {
        this.currentCategory = { estado: true, mostrar_en_navbar: false };
        this.isEditingCategory = false;
        this.categoryDialog = true;
    }

    editCategory(category: CategoriaLanding) {
        this.currentCategory = { ...category };
        this.isEditingCategory = true;
        this.categoryDialog = true;
    }

    deleteCategory(category: CategoriaLanding) {
        this.confirmationService.confirm({
            message: `¿Estás seguro que deseas eliminar la categoría "${category.nombre}" y todas sus subcategorías?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.landingService.deleteCategory(category.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Categoría eliminada' });
                        this.loadCategories();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la categoría' })
                });
            }
        });
    }

    saveCategory() {
        if (!this.currentCategory.nombre?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El nombre es obligatorio' });
            return;
        }

        const request = this.isEditingCategory
            ? this.landingService.updateCategory(this.currentCategory.id!, this.currentCategory)
            : this.landingService.createCategory(this.currentCategory);

        request.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Categoría ${this.isEditingCategory ? 'actualizada' : 'creada'}` });
                this.categoryDialog = false;
                this.loadCategories();
            },
            error: (err) => {
                const msg = err.error?.message || 'Error al guardar categoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    openNewSubcategory(category: CategoriaLanding) {
        this.currentSubcategory = { categoria_id: category.id, estado: true, mostrar_en_navbar: false };
        this.isEditingSubcategory = false;
        this.subcategoryDialog = true;
    }

    editSubcategory(subcategory: SubcategoriaLanding) {
        this.currentSubcategory = { ...subcategory };
        this.isEditingSubcategory = true;
        this.subcategoryDialog = true;
    }

    deleteSubcategory(subcategory: SubcategoriaLanding) {
        this.confirmationService.confirm({
            message: `¿Estás seguro que deseas eliminar la subcategoría "${subcategory.nombre}"?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.landingService.deleteSubcategory(subcategory.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Subcategoría eliminada' });
                        this.loadCategories();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la subcategoría' })
                });
            }
        });
    }

    saveSubcategory() {
        if (!this.currentSubcategory.nombre?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'El nombre es obligatorio' });
            return;
        }

        const request = this.isEditingSubcategory
            ? this.landingService.updateSubcategory(this.currentSubcategory.id!, this.currentSubcategory)
            : this.landingService.createSubcategory(this.currentSubcategory);

        request.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Subcategoría ${this.isEditingSubcategory ? 'actualizada' : 'creada'}` });
                this.subcategoryDialog = false;
                this.loadCategories();
            },
            error: (err) => {
                const msg = err.error?.message || 'Error al guardar subcategoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    onCategoryToggle(category: CategoriaLanding) {
        this.landingService.updateCategory(category.id, {
            mostrar_en_navbar: category.mostrar_en_navbar
        }).subscribe({
            next: (updated) => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Categoría "${updated.nombre}" actualizada.` });
            },
            error: (err) => {
                category.mostrar_en_navbar = !category.mostrar_en_navbar;
                const msg = err.error?.message || 'Error al actualizar categoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

    onCategoryStatusChange(category: CategoriaLanding) {
        this.landingService.updateCategory(category.id, {
            estado: category.estado
        }).subscribe({
            next: (updated) => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Estado de la categoría "${updated.nombre}" actualizado.` });
            },
            error: (err) => {
                category.estado = !category.estado;
                const msg = err.error?.message || 'Error al actualizar categoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
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

    onSubcategoryStatusChange(subcategory: SubcategoriaLanding) {
        this.landingService.updateSubcategory(subcategory.id, {
            estado: subcategory.estado
        }).subscribe({
            next: (updated) => {
                this.messageService.add({ severity: 'success', summary: 'Actualizado', detail: `Estado de la subcategoría "${updated.nombre}" actualizado.` });
            },
            error: (err) => {
                subcategory.estado = !subcategory.estado;
                const msg = err.error?.message || 'Error al actualizar subcategoría.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }

}
