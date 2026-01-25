import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../landing/components/navbar/navbar';
import { FooterSection } from '../../landing/components/footer-section/footer-section';
import { LandingService, Category, SubCategory } from '../../core/services/landing';
import { Router, RouterModule } from '@angular/router';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, Navbar, FooterSection, FormsModule, RouterModule],
    templateUrl: './products.html',
    styleUrls: ['../../../assets/css/products.css']
})
export class Products implements OnInit, AfterViewInit {
    categories: Category[] = [];
    filteredProducts: { category: string, subCategory: SubCategory }[] = [];
    allProducts: { category: string, subCategory: SubCategory }[] = [];

    currentCategory: string = 'all';
    currentSearchTerm: string = '';

    showLeftArrow: boolean = false;
    showRightArrow: boolean = false;

    @ViewChild('tabsContainer') tabsContainer!: ElementRef;
    @ViewChildren('productCard') productCards!: QueryList<ElementRef>;

    constructor(
        private landingService: LandingService,
        private router: Router
    ) { }

    ngOnInit() {
        this.landingService.getNavbarCategories().subscribe(categories => {
            this.categories = categories;
            this.processAllProducts();
            this.filterProducts();
        });
    }

    ngAfterViewInit() {
        this.checkArrows();
        // Re-check arrows on window resize
    }

    @HostListener('window:resize')
    onResize() {
        this.checkArrows();
    }

    processAllProducts() {
        this.allProducts = [];
        this.categories.forEach(cat => {
            cat.subcategorias.forEach(sub => {
                this.allProducts.push({
                    category: cat.slug,
                    subCategory: sub
                });
            });
        });
    }

    getCategoryName(slug: string): string {
        if (slug === 'all') return 'Todas';
        const cat = this.categories.find(c => c.slug === slug);
        return cat ? cat.nombre : '';
    }

    getCategoryDescription(slug: string): string {
        if (slug === 'all') return 'Explore nuestro catálogo completo de productos para maquinaria pesada.';
        const cat = this.categories.find(c => c.slug === slug);

        if (cat && cat.descripcion_general) {
            return cat.descripcion_general;
        }

        return cat ? `Explore los productos de la categoría ${cat.nombre}` : '';
    }

    setCategory(categorySlug: string) {
        this.currentCategory = categorySlug;
        this.filterProducts();
    }

    filterProducts() {
        const normalizedSearch = this.normalizeText(this.currentSearchTerm);

        this.filteredProducts = this.allProducts.filter(item => {
            const matchesCategory = this.currentCategory === 'all' || item.category === this.currentCategory;

            const productName = this.normalizeText(item.subCategory.nombre);
            const productDesc = this.normalizeText(item.subCategory.descripcion);
            const categoryName = this.normalizeText(this.getCategoryName(item.category));

            const matchesSearch = !normalizedSearch ||
                productName.includes(normalizedSearch) ||
                productDesc.includes(normalizedSearch) ||
                categoryName.includes(normalizedSearch);

            return matchesCategory && matchesSearch;
        });

        // Re-trigger animations logic if needed (Angular handles DOM updates, CSS fade-in can be handled with simple class binding)
    }

    onSearchChange() {
        this.filterProducts();
    }

    clearSearch() {
        this.currentSearchTerm = '';
        this.filterProducts();
    }

    normalizeText(text: string): string {
        if (!text) return '';
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    scrollTabs(direction: 'left' | 'right') {
        if (!this.tabsContainer) return;

        const container = this.tabsContainer.nativeElement;
        const scrollAmount = container.clientWidth * 0.8;
        const targetScroll = container.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        });

        // Necesitamos esperar a qu termine el scroll para actualizar flechas, 
        // pero el evento scroll del contenedor lo manejará mejor.
    }

    onTabsScroll() {
        this.checkArrows();
    }

    checkArrows() {
        if (!this.tabsContainer) return;
        const container = this.tabsContainer.nativeElement;

        this.showLeftArrow = container.scrollLeft > 10;
        this.showRightArrow = container.scrollLeft < (container.scrollWidth - container.clientWidth - 10);
    }
}
