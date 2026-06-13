import { test, expect } from '@playwright/test';
import { isDarkModeActive, toggleDarkModeViaUI } from './helpers/theme.helpers';

test.describe('E2E: Sistema de Temas Unificado - Modo Claro/Oscuro', () => {
    test.beforeEach(async ({ page }) => {
        // Mockear endpoints para evitar errores de autenticación/redirección
        await page.route('**/api/v1/**', async (route) => {
            await route.fulfill({ status: 200, json: { data: {} } });
        });
        await page.goto('/');
    });

    test('debería inicializarse en modo claro por defecto', async ({ page }) => {
        const isDark = await isDarkModeActive(page);
        expect(isDark).toBe(false);
    });

    test('debería cambiar a modo oscuro al hacer click en el toggle del topbar y agregar la clase app-dark', async ({ page }) => {
        // Asegurar estado inicial claro
        expect(await isDarkModeActive(page)).toBe(false);

        // Alternar
        await toggleDarkModeViaUI(page);
        expect(await isDarkModeActive(page)).toBe(true);

        // Volver a alternar
        await toggleDarkModeViaUI(page);
        expect(await isDarkModeActive(page)).toBe(false);
    });

    test('debería persistir la preferencia de tema oscuro en localStorage al recargar la página', async ({ page }) => {
        // Alternar a oscuro
        await toggleDarkModeViaUI(page);
        expect(await isDarkModeActive(page)).toBe(true);

        // Recargar la página
        await page.reload();

        // Verificar que se mantiene el modo oscuro
        expect(await isDarkModeActive(page)).toBe(true);
    });
});
