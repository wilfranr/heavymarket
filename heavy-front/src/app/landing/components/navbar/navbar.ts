import { Component, EventEmitter, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LandingService, Category } from '../../../core/services/landing';
import { ClientAuthService } from '../../../core/services/client-auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterModule, AuthModalComponent],
    templateUrl: './navbar.html',
    styles: [`
        .user-dropdown-wrapper {
            position: relative;
            cursor: pointer;
            z-index: 1001;
        }

        .navbar-user-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50px;
            padding: 6px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #fff;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            height: 44px;

            &:hover, &.active {
                background: rgba(253, 184, 49, 0.1);
                border-color: #fdb831;
                color: #fdb831;
            }

            .user-info-brief {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                
                .user-name-text {
                    font-size: 0.9rem;
                    font-weight: 600;
                    max-width: 80px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }

        .user-dropdown-menu {
            position: absolute;
            top: calc(100% + 15px);
            right: 0;
            width: 240px;
            background: #1a1c1e;
            border: 1px solid #333;
            border-radius: 16px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4);
            padding: 8px;
            animation: dropdownFade 0.2s ease-out;
            transform-origin: top right;

            &::before {
                content: '';
                position: absolute;
                top: -8px;
                right: 20px;
                width: 16px;
                height: 16px;
                background: #1a1c1e;
                border-left: 1px solid #333;
                border-top: 1px solid #333;
                transform: rotate(45deg);
            }
        }

        @keyframes dropdownFade {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .dropdown-header {
            padding: 16px;
            border-bottom: 1px solid #333;
            margin-bottom: 8px;

            .header-welcome {
                font-size: 0.75rem;
                color: #888;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .header-name {
                font-size: 1rem;
                font-weight: 700;
                color: #fff;
                margin: 4px 0 0 0;
            }
        }

        .dropdown-links {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            color: #ccc;
            text-decoration: none;
            border-radius: 10px;
            transition: all 0.2s;
            font-size: 0.95rem;

            i {
                font-size: 1.1rem;
                width: 20px;
                text-align: center;
            }

            &:hover {
                background: rgba(255, 255, 255, 0.05);
                color: #fff;
            }

            &.admin-link {
                color: #fdb831;
                font-weight: 600;
                &:hover {
                    background: rgba(253, 184, 49, 0.1);
                }
            }

            &.logout-btn {
                color: #ff4d4d;
                &:hover {
                    background: rgba(255, 77, 77, 0.1);
                }
            }
        }

        .dropdown-divider {
            height: 1px;
            background: #333;
            margin: 8px 0;
        }

        .action-divider {
            color: #333;
            font-size: 1.2rem;
            margin: 0 5px;
            opacity: 0.5;
        }

        .navbar-button-whatsapp {
            background: #fdb831;
            color: #0c0e0f;
            padding: 10px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
            transition: transform 0.2s, box-shadow 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(253, 184, 49, 0.3);
            }
        }
    `]
})
export class Navbar implements OnInit {
    categories = signal<Category[]>([]);
    activeCategory = signal<string>('');
    isMenuOpen = signal<boolean>(false);
    hoverTimeout: any;
    closeTimeout: any;

    // Dropdowns
    isUserDropdownOpen = signal<boolean>(false);
    isMobileMenuOpen = signal<boolean>(false);
    expandedCategories = signal<Set<string>>(new Set());

    // Auth Modal
    isAuthModalVisible: boolean = false;
    currentUser: any = null;

    @Output() openTerms = new EventEmitter<void>();

    constructor(
        private landingService: LandingService,
        private route: ActivatedRoute,
        private clientAuthService: ClientAuthService, // Assuming I might need it, but actually fetching user details from token would be better?
        private router: Router
    ) { }

    ngOnInit() {
        this.landingService.getNavbarCategories().subscribe((data) => {
            this.categories.set(data);
            if (data.length > 0) {
                this.activeCategory.set(data[0].slug);
            }
        });

        const storedUser = localStorage.getItem('clientUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }

        // Check for social login callback
        this.route.queryParams.subscribe(params => {
            if (params['token']) {
                const token = params['token'];
                localStorage.setItem('clientToken', token);

                // Fetch user logic? 
                // Since token is new, we don't have user details.
                // We should fetch 'me' or just decode token if it has info (it doesn't usually).
                // Or backend could return user info in URL but that's insecure/ugly.
                // Better: use the token to fetch user profile.

                // For now, let's assume we need to fetch user.
                // Use a service to fetch user. ClientAuthService doesn't have 'me'.
                // I'll add 'me' to ClientAuthService or just use generic userService if available.
                // But wait, the prompt is about login implementation.
                // I'll add `me()` to ClientAuthService.

                this.clientAuthService.me().subscribe({
                    next: (user) => {
                        this.currentUser = user;
                        localStorage.setItem('clientUser', JSON.stringify(user));
                        // clear URL params
                        this.router.navigate([], {
                            queryParams: { 'token': null },
                            queryParamsHandling: 'merge'
                        });
                        this.isAuthModalVisible = false;
                    }
                });
            }
        });
    }

    openAuthModal() {
        this.isAuthModalVisible = true;
    }

    logout() {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientUser');
        this.currentUser = null;
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
            this.isMenuOpen.set(true);
        }, 150);
    }

    onMouseLeave() {
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        this.closeTimeout = setTimeout(() => {
            this.isMenuOpen.set(false);
        }, 300);
    }

    setActiveCategory(slug: string) {
        this.activeCategory.set(slug);
    }

    // Mobile menu methods
    toggleMobileMenu() {
        this.isMobileMenuOpen.update(v => !v);
        // Prevent body scroll when menu is open
        if (this.isMobileMenuOpen()) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            this.expandedCategories.set(new Set());
        }
    }

    closeMobileMenu() {
        this.isMobileMenuOpen.set(false);
        document.body.style.overflow = '';
        this.expandedCategories.set(new Set());
    }

    toggleCategory(slug: string, event?: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.expandedCategories.update(set => {
            const newSet = new Set(set);
            if (newSet.has(slug)) {
                newSet.delete(slug);
            } else {
                newSet.add(slug);
            }
            return newSet;
        });
    }

    isCategoryExpanded(slug: string): boolean {
        return this.expandedCategories().has(slug);
    }
}
