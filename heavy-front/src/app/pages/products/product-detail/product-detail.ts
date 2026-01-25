import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../../landing/components/navbar/navbar';
import { FooterSection } from '../../../landing/components/footer-section/footer-section';
import { LandingService, Category, SubCategory } from '../../../core/services/landing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, Navbar, FooterSection, RouterModule],
    templateUrl: './product-detail.html',
    styleUrls: ['../../../../assets/css/product-detail.css']
})
export class ProductDetail implements OnInit {
    categorySlug: string = '';
    subCategorySlug: string = '';

    category: Category | null = null;
    subCategory: SubCategory | null = null;

    loading: boolean = true;
    error: boolean = false;

    // Propiedades opcionales del modelo Category/SubCategory que no están en la interfaz pero se usan en la vista
    // Podemos extender la interfaz localmente o manejarlo con 'any' temporalmente
    categoryDescription: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private landingService: LandingService,
        private _location: Location
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.categorySlug = params['category'];
            this.subCategorySlug = params['subcategory'];
            this.loadProduct();
        });
    }

    loadProduct() {
        this.loading = true;
        this.landingService.getNavbarCategories().subscribe({
            next: (categories) => {
                const cat = categories.find(c => c.slug === this.categorySlug);
                if (cat) {
                    this.category = cat;
                    const sub = cat.subcategorias.find(s => s.slug === this.subCategorySlug);
                    if (sub) {
                        this.subCategory = sub;
                        // Simulamos la descripción general de la categoría si no viene en el API
                        this.categoryDescription = `Explore nuestra gama completa de ${cat.nombre} diseñados para el máximo rendimiento y durabilidad en condiciones exigentes.`;
                    } else {
                        this.error = true;
                    }
                } else {
                    this.error = true;
                }
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.error = true;
                this.loading = false;
            }
        });
    }

    goBack() {
        window.history.back();
    }
}
import { Location } from '@angular/common';
