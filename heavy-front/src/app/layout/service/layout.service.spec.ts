import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { LayoutService, layoutConfig } from './layout.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { User } from '../../core/auth/models/user.model';

describe('LayoutService', () => {
    let service: LayoutService;
    let mockAuthService: {
        currentUser: any;
    };

    beforeEach(() => {
        // Mock AuthService con un signal
        mockAuthService = {
            currentUser: signal<User | null>(null)
        };

        TestBed.configureTestingModule({
            providers: [LayoutService, { provide: AuthService, useValue: mockAuthService }]
        });

        // Limpiar localStorage antes de cada test
        localStorage.clear();
        document.documentElement.classList.remove('app-dark');
    });

    afterEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('app-dark');
    });

    it('debería ser creado', () => {
        service = TestBed.inject(LayoutService);
        expect(service).toBeTruthy();
    });

    it('debería inicializarse con el tema oscuro por defecto como false si no hay localStorage', () => {
        service = TestBed.inject(LayoutService);
        expect(service.isDarkTheme()).toBe(false);
        expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    });

    it('debería cargar la preferencia de tema oscuro desde localStorage', () => {
        localStorage.setItem('heavymarket_dark_theme', 'true');
        service = TestBed.inject(LayoutService);
        expect(service.isDarkTheme()).toBe(true);
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);
    });

    it('debería cambiar el tema oscuro correctamente mediante toggleDarkMode', () => {
        service = TestBed.inject(LayoutService);

        // Activar dark theme
        service.layoutConfig.update((prev) => ({ ...prev, darkTheme: true }));
        service.toggleDarkMode();
        expect(document.documentElement.classList.contains('app-dark')).toBe(true);

        // Desactivar dark theme
        service.layoutConfig.update((prev) => ({ ...prev, darkTheme: false }));
        service.toggleDarkMode();
        expect(document.documentElement.classList.contains('app-dark')).toBe(false);
    });

    it('debería aplicar el color primario adecuado según el rol de usuario', () => {
        // Cambiar el valor del signal en el mock antes de inyectar el servicio para evaluar el effect inicial
        const user: User = {
            id: 1,
            name: 'Vendedor Test',
            email: 'vendedor@test.com',
            roles: ['Vendedor']
        };
        mockAuthService.currentUser.set(user);

        service = TestBed.inject(LayoutService);

        // Forzar la ejecución de efectos
        TestBed.flushEffects();

        expect(service.getPrimary()).toBe('blue');
    });

    it('debería aplicar color primario emerald para el rol Analista', () => {
        const user: User = {
            id: 2,
            name: 'Analista Test',
            email: 'analista@test.com',
            roles: ['Analista']
        };
        mockAuthService.currentUser.set(user);

        service = TestBed.inject(LayoutService);
        TestBed.flushEffects();

        expect(service.getPrimary()).toBe('emerald');
    });

    it('debería aplicar color primario heavy para el rol Administrador u otros', () => {
        const user: User = {
            id: 3,
            name: 'Admin Test',
            email: 'admin@test.com',
            roles: ['Administrador']
        };
        mockAuthService.currentUser.set(user);

        service = TestBed.inject(LayoutService);
        TestBed.flushEffects();

        expect(service.getPrimary()).toBe('heavy');
    });
});
