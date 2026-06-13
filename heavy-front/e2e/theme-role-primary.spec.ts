import { test, expect } from '@playwright/test';
import { mockUserRole } from './helpers/theme.helpers';

test.describe('E2E: Color Primario dinámico según Rol de Usuario', () => {
    test('debería cambiar el color primario a azul para el rol Vendedor', async ({ page }) => {
        await mockUserRole(page, 'Vendedor');
        await page.goto('/');

        // Esperar a que se evalúe el rol del usuario y se aplique el preset
        await page.waitForTimeout(1000);

        // Obtener el valor de color primario en el CSS
        const primaryColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--p-primary-500').trim();
        });

        // El color 'blue' 500 de Lara/Aura suele ser #3b82f6 o rgb(59, 130, 246)
        expect(primaryColor).toMatch(/^(#3b82f6|rgb\(59,\s*130,\s*246\)|#1c64f2|rgb\(28,\s*100,\s*242\))/i);
    });

    test('debería cambiar el color primario a emerald para el rol Analista', async ({ page }) => {
        await mockUserRole(page, 'Analista');
        await page.goto('/');

        await page.waitForTimeout(1000);

        const primaryColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--p-primary-500').trim();
        });

        // El color 'emerald' 500 suele ser #10b981 o rgb(16, 185, 129)
        expect(primaryColor).toMatch(/^(#10b981|rgb\(16,\s*185,\s*129\)|#059669|rgb\(5,\s*150,\s*105\))/i);
    });

    test('debería cambiar el color primario a amarillo heavy (#fdb831) para Administradores', async ({ page }) => {
        await mockUserRole(page, 'Administrador');
        await page.goto('/');

        await page.waitForTimeout(1000);

        const primaryColor = await page.evaluate(() => {
            return getComputedStyle(document.documentElement).getPropertyValue('--p-primary-500').trim();
        });

        // El amarillo corporativo de HeavyMarket es #fdb831 o rgb(253, 184, 49)
        expect(primaryColor).toMatch(/^(#fdb831|rgb\(253,\s*184,\s*49\))/i);
    });
});
