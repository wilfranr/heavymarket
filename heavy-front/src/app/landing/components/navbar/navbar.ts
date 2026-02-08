import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingService, Category } from '../../../core/services/landing';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule, RouterModule],
    templateUrl: './navbar.html',
    styles: ``
})
export class Navbar implements OnInit {
    categories: Category[] = [];
    activeCategory: string = '';
    isMenuOpen: boolean = false;
    hoverTimeout: any;
    closeTimeout: any;

    // Mobile menu properties
    isMobileMenuOpen: boolean = false;
    expandedCategories: Set<string> = new Set();

    constructor(private landingService: LandingService) { }

    ngOnInit() {
        this.landingService.getNavbarCategories().subscribe((data) => {
            this.categories = data;
            if (this.categories.length > 0) {
                this.activeCategory = this.categories[0].slug;
            }
        });
    }

    getHalf(count: number): number {
        return Math.ceil(count / 2);
    }

    onMouseEnter() {
        if (this.closeTimeout) {
            clearTimeout(this.closeTimeout);
        }

        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        this.hoverTimeout = setTimeout(() => {
            this.isMenuOpen = true;
        }, 150);
    }

    onMouseLeave() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        this.closeTimeout = setTimeout(() => {
            this.isMenuOpen = false;
        }, 300);
    }

    setActiveCategory(slug: string) {
        this.activeCategory = slug;
    }

    // Mobile menu methods
    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        // Prevent body scroll when menu is open
        if (this.isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            this.expandedCategories.clear();
        }
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        document.body.style.overflow = '';
        this.expandedCategories.clear();
    }

    toggleCategory(slug: string, event?: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (this.expandedCategories.has(slug)) {
            this.expandedCategories.delete(slug);
        } else {
            this.expandedCategories.add(slug);
        }
    }

    isCategoryExpanded(slug: string): boolean {
        return this.expandedCategories.has(slug);
    }
}
