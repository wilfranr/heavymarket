import { Component, OnInit, ViewEncapsulation, signal, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Navbar } from '../../../landing/components/navbar/navbar';
import { FooterSection } from '../../../landing/components/footer-section/footer-section';
import { LandingService, Category, SubCategory } from '../../../core/services/landing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, Navbar, FooterSection, RouterModule],
    templateUrl: './product-detail.html',
    styleUrls: ['../../../../assets/css/landing.css', '../../../../assets/css/product-detail.css'],
    encapsulation: ViewEncapsulation.None
})
export class ProductDetail implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly landingService = inject(LandingService);
    private readonly _location = inject(Location);

    categorySlug = signal<string>('');
    subCategorySlug = signal<string>('');

    category = signal<Category | null>(null);
    subCategory = signal<SubCategory | null>(null);

    loading = signal<boolean>(true);
    error = signal<boolean>(false);

    categoryDescription = signal<string>('');

    ngOnInit() {
        this.route.params.subscribe((params) => {
            this.categorySlug.set(params['category'] || '');
            this.subCategorySlug.set(params['subcategory'] || '');
            this.loadProduct();
        });
    }

    loadProduct() {
        this.loading.set(true);
        this.error.set(false);

        // Agregamos un timeout de seguridad para que la UI no se quede bloqueada
        const safetyTimeout = setTimeout(() => {
            if (this.loading()) {
                console.warn('Carga de producto tomó demasiado tiempo, desactivando spinner por seguridad.');
                this.loading.set(false);
            }
        }, 5000);

        this.landingService.getAllCategories().subscribe({
            next: (categories) => {
                clearTimeout(safetyTimeout);
                
                // Usamos setTimeout(0) para asegurar que el renderizado ocurra en un tick diferente, 
                // resolviendo problemas de detección de cambios en modo Zoneless.
                setTimeout(() => {
                    const cat = categories.find((c) => c.slug === this.categorySlug());
                    if (cat) {
                        this.category.set(cat);
                        const sub = (cat.subcategorias || []).find((s) => s.slug === this.subCategorySlug());
                        if (sub) {
                            this.subCategory.set(sub);
                            this.categoryDescription.set(
                                `Explore nuestra gama completa de ${cat.nombre} diseñados para el máximo rendimiento y durabilidad en condiciones exigentes.`
                            );
                        } else {
                            this.error.set(true);
                        }
                    } else {
                        this.error.set(true);
                    }
                    this.loading.set(false);
                }, 0);
            },
            error: (err) => {
                clearTimeout(safetyTimeout);
                console.error('Error loading product:', err);
                this.error.set(true);
                this.loading.set(false);
            }
        });
    }

    goBack() {
        this._location.back();
    }
}
