import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'heavymarket-theme';

    // Signal para reactividad
    theme = signal<Theme>(this.getInitialTheme());

    constructor() {
        this.applyTheme(this.theme());
    }

    /**
     * Obtiene el tema inicial desde localStorage o usa 'dark' por defecto
     */
    private getInitialTheme(): Theme {
        const saved = localStorage.getItem(this.THEME_KEY);
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    }

    /**
     * Alterna entre modo claro y oscuro
     */
    toggleTheme(): void {
        const newTheme: Theme = this.theme() === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Establece un tema específico
     */
    setTheme(theme: Theme): void {
        this.theme.set(theme);
        this.applyTheme(theme);
        localStorage.setItem(this.THEME_KEY, theme);
    }

    /**
     * Aplica el tema al documento
     */
    private applyTheme(theme: Theme): void {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        } else {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        }
    }

    /**
     * Verifica si el tema actual es oscuro
     */
    isDark(): boolean {
        return this.theme() === 'dark';
    }

    /**
     * Verifica si el tema actual es claro
     */
    isLight(): boolean {
        return this.theme() === 'light';
    }
}
