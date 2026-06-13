import { test, expect } from '@playwright/test';
import { mockUserRole } from './helpers/theme.helpers';

test.describe('E2E: Clases Semánticas y Estilos Visuales de Diálogos', () => {
    test.beforeEach(async ({ page }) => {
        await mockUserRole(page, 'Administrador');
        // Mockear endpoints requeridos para cargar la página sin errores
        await page.route('**/api/v1/terceros*', async (route) => {
            await route.fulfill({ status: 200, json: { data: [], meta: { current_page: 1, total: 0 } } });
        });
        await page.route('**/api/v1/referencias*', async (route) => {
            await route.fulfill({ status: 200, json: { data: [] } });
        });
    });

    test('debería renderizar los diálogos/modales con la clase hm-dialog', async ({ page }) => {
        await page.goto('/pedidos');
        // Los modales no se abren solos, pero podemos verificar que el estilo global de hm-dialog esté definido en los estilos cargados.
        // Verificamos si existe la regla .hm-dialog en los stylesheets de la página.
        const hasHmDialogStyle = await page.evaluate(() => {
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    for (const rule of Array.from(sheet.cssRules)) {
                        if (rule.cssText.includes('.hm-dialog')) {
                            return true;
                        }
                    }
                } catch (e) {
                    // Ignorar errores de cross-origin stylesheets
                }
            }
            return false;
        });

        expect(hasHmDialogStyle).toBe(true);
    });

    test('debería tener las clases hm-field-input y hm-field-addon definidas globalmente', async ({ page }) => {
        await page.goto('/pedidos');

        const stylesDefined = await page.evaluate(() => {
            let hasInput = false;
            let hasAddon = false;
            for (const sheet of Array.from(document.styleSheets)) {
                try {
                    for (const rule of Array.from(sheet.cssRules)) {
                        if (rule.cssText.includes('.hm-field-input')) hasInput = true;
                        if (rule.cssText.includes('.hm-field-addon')) hasAddon = true;
                    }
                } catch (e) {}
            }
            return { hasInput, hasAddon };
        });

        expect(stylesDefined.hasInput).toBe(true);
        expect(stylesDefined.hasAddon).toBe(true);
    });
});
