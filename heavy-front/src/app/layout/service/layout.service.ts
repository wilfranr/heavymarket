import { Injectable, effect, signal, computed, inject, untracked } from '@angular/core';
import { Subject } from 'rxjs';
import { updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { PrimeNG } from 'primeng/config';
import { AuthService } from '../../core/auth/services/auth.service';

const presets = {
    Aura,
    Lara,
    Nora
} as const;

export interface layoutConfig {
    preset?: string;
    primary?: string;
    surface?: string | undefined | null;
    darkTheme?: boolean;
    menuMode?: string;
}

interface LayoutState {
    staticMenuDesktopInactive?: boolean;
    overlayMenuActive?: boolean;
    configSidebarVisible?: boolean;
    staticMenuMobileActive?: boolean;
    menuHoverActive?: boolean;
}

interface MenuChangeEvent {
    key: string;
    routeEvent?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private readonly DARK_THEME_KEY = 'heavymarket_dark_theme';

    _config: layoutConfig = {
        preset: 'Aura',
        primary: 'yellow',
        surface: null,
        darkTheme: this.loadDarkThemePreference(),
        menuMode: 'static'
    };

    _state: LayoutState = {
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        staticMenuMobileActive: false,
        menuHoverActive: false
    };

    layoutConfig = signal<layoutConfig>(this._config);

    layoutState = signal<LayoutState>(this._state);

    private configUpdate = new Subject<layoutConfig>();

    private overlayOpen = new Subject<any>();

    private menuSource = new Subject<MenuChangeEvent>();

    private resetSource = new Subject();

    menuSource$ = this.menuSource.asObservable();

    resetSource$ = this.resetSource.asObservable();

    configUpdate$ = this.configUpdate.asObservable();

    overlayOpen$ = this.overlayOpen.asObservable();

    theme = computed(() => (this.layoutConfig()?.darkTheme ? 'light' : 'dark'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().staticMenuMobileActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    private authService = inject(AuthService);

    constructor() {
        // Aplicar el tema guardado inmediatamente al inicializar
        this.toggleDarkMode(this._config);

        // Efecto para cambiar el color primario según el rol del usuario
        effect(() => {
            const user = this.authService.currentUser();
            untracked(() => {
                if (user) {
                    if (user.roles.includes('Analista')) {
                        this.applyPrimaryColor('emerald');
                    } else if (user.roles.includes('Vendedor') || user.roles.includes('Asesor')) {
                        this.applyPrimaryColor('blue');
                    } else {
                        this.applyPrimaryColor('heavy');
                    }
                } else {
                    // Default al cerrar sesión o si no hay usuario
                    this.applyPrimaryColor('heavy');
                }
            });
        });

        effect(() => {
            const config = this.layoutConfig();
            if (config) {
                this.onConfigUpdate();
                this.saveDarkThemePreference(config.darkTheme || false);
            }
        });

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.handleDarkModeTransition(config);
        });
    }

    /**
     * Cargar preferencia de tema oscuro desde localStorage
     */
    private loadDarkThemePreference(): boolean {
        try {
            const stored = localStorage.getItem(this.DARK_THEME_KEY);
            return stored ? JSON.parse(stored) : false;
        } catch (error) {
            console.error('Error al cargar preferencia de tema:', error);
            return false;
        }
    }

    /**
     * Guardar preferencia de tema oscuro en localStorage
     */
    private saveDarkThemePreference(darkTheme: boolean): void {
        try {
            localStorage.setItem(this.DARK_THEME_KEY, JSON.stringify(darkTheme));
        } catch (error) {
            console.error('Error al guardar preferencia de tema:', error);
        }
    }

    private handleDarkModeTransition(config: layoutConfig): void {
        if ((document as any).startViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
            this.onTransitionEnd();
        }
    }

    private startViewTransition(config: layoutConfig): void {
        const transition = (document as any).startViewTransition(() => {
            this.toggleDarkMode(config);
        });

        transition.ready
            .then(() => {
                this.onTransitionEnd();
            })
            .catch(() => {});
    }

    toggleDarkMode(config?: layoutConfig): void {
        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    private onTransitionEnd() {
        this.transitionComplete.set(true);
        setTimeout(() => {
            this.transitionComplete.set(false);
        });
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));

            if (this.layoutState().overlayMenuActive) {
                this.overlayOpen.next(null);
            }
        }

        if (this.isDesktop()) {
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: !this.layoutState().staticMenuDesktopInactive }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, staticMenuMobileActive: !this.layoutState().staticMenuMobileActive }));

            if (this.layoutState().staticMenuMobileActive) {
                this.overlayOpen.next(null);
            }
        }
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }

    onConfigUpdate() {
        this._config = { ...this.layoutConfig() };
        this.configUpdate.next(this.layoutConfig());
    }

    onMenuStateChange(event: MenuChangeEvent) {
        this.menuSource.next(event);
    }

    reset() {
        this.resetSource.next(true);
    }

    private getPrimaryPalette(colorName: string): any {
        const preset = this.layoutConfig().preset as 'Aura' | 'Lara' | 'Nora';
        const primitive = presets[preset].primitive;
        
        if (colorName === 'heavy') {
            return {
                50: '#fffaf0',
                100: '#fff3d6',
                200: '#ffe6a8',
                300: '#ffd87a',
                400: '#ffca4d',
                500: '#fdb831',
                600: '#e69d1a',
                700: '#cc830d',
                800: '#a6670b',
                900: '#8a530e',
                950: '#4d2b00'
            };
        }
        
        return (primitive as any)?.[colorName] || (primitive as any)?.[this.layoutConfig().primary || 'yellow'];
    }

    applyPrimaryColor(colorName: string) {
        // Evitar reaplicar si ya es el color actual
        if (this.layoutConfig().primary === colorName && this.initialized) {
            return;
        }

        const palette = this.getPrimaryPalette(colorName);
        this.layoutConfig.update(prev => ({ ...prev, primary: colorName }));
        
        const preset = this.layoutConfig().preset;
        const config = {
            semantic: {
                primary: palette,
                colorScheme: {
                    light: {
                        primary: {
                            color: '{primary.500}',
                            contrastColor: '#ffffff',
                            hoverColor: '{primary.600}',
                            activeColor: '{primary.700}'
                        },
                        highlight: {
                            background: '{primary.50}',
                            focusBackground: '{primary.100}',
                            color: '{primary.700}',
                            focusColor: '{primary.800}'
                        }
                    },
                    dark: {
                        primary: {
                            color: '{primary.400}',
                            contrastColor: '{surface.900}',
                            hoverColor: '{primary.300}',
                            activeColor: '{primary.200}'
                        },
                        highlight: {
                            background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
                            focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
                            color: 'rgba(255,255,255,.87)',
                            focusColor: 'rgba(255,255,255,.87)'
                        }
                    }
                }
            }
        };

        updatePreset(config);
    }
}
