import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LandingService, Category } from '../../../core/services/landing';
import { Banner } from '../banner/banner';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule, RouterModule, Banner],
    templateUrl: './navbar.html',
    styles: ``
})
export class Navbar implements OnInit {
    categories: Category[] = [];
    activeCategory: string = '';
    isMenuOpen: boolean = false;
    hoverTimeout: any;
    closeTimeout: any;

    constructor(private landingService: LandingService) {}

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
}
