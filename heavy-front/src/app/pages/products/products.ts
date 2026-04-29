import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener, ViewChildren, QueryList, signal, computed } from '@angular/core';
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
    categories = signal<Category[]>([]);
    currentCategory = signal<string>('all');
    currentSearchTerm = signal<string>('');

    allProducts = computed(() => {
        const cats = this.categories();
        const products: { category: string; subCategory: SubCategory }[] = [];
        cats.forEach((cat) => {
            cat.subcategorias.forEach((sub) => {
                products.push({
                    category: cat.slug,
                    subCategory: sub
                });
            });
        });
        return products;
    });

    filteredProducts = computed(() => {
        const all = this.allProducts();
        const category = this.currentCategory();
        const search = this.normalizeText(this.currentSearchTerm());

        return all.filter((item: { category: string; subCategory: SubCategory }) => {
            const matchesCategory = category === 'all' || item.category === category;

            const productName = this.normalizeText(item.subCategory.nombre);
            const productDesc = this.normalizeText(item.subCategory.descripcion);
            const categoryName = this.normalizeText(this.getCategoryName(item.category));

            const matchesSearch = !search || productName.includes(search) || productDesc.includes(search) || categoryName.includes(search);

            return matchesCategory && matchesSearch;
        });
    });

    showLeftArrow = signal(false);
    showRightArrow = signal(false);

    @ViewChild('tabsContainer') tabsContainer!: ElementRef;
    @ViewChildren('productCard') productCards!: QueryList<ElementRef>;

    constructor(
        private landingService: LandingService,
        private router: Router
    ) { }

    ngOnInit() {
        this.landingService.getAllCategories().subscribe((categories) => {
            this.categories.set(categories);
            this.checkArrows();
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

    getCategoryName(slug: string): string {
        if (slug === 'all') return 'Todas';
        const cat = this.categories().find((c) => c.slug === slug);
        return cat ? cat.nombre : '';
    }

    getCategoryDescription(slug: string): string {
        if (slug === 'all') return 'Explore nuestro catálogo completo de productos para maquinaria pesada.';
        const cat = this.categories().find((c) => c.slug === slug);
        if (cat && cat.descripcion_general) {
            return cat.descripcion_general;
        }
        return cat ? `Explore los productos de la categoría ${cat.nombre}` : '';
    }

    setCategory(categorySlug: string) {
        this.currentCategory.set(categorySlug);
    }

    clearSearch() {
        this.currentSearchTerm.set('');
    }

    normalizeText(text: string): string {
        if (!text) return '';
        return text
            .toLowerCase()
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

        this.showLeftArrow.set(container.scrollLeft > 10);
        this.showRightArrow.set(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
}
