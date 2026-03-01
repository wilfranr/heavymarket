import { test, expect } from '@playwright/test';

test.describe('Página Cotizar', () => {
    test('carga la ruta /cotizar', async ({ page }) => {
        await page.goto('/cotizar');
        await expect(page).toHaveURL(/\/cotizar/);
        // Sin login se muestra mensaje "under construction" o con login el cotizador
        const body = page.locator('body');
        await expect(body).toBeVisible();
        const hasConstruction = page.getByText(/tiempo es el repuesto|Volveremos a encender motores/i);
        const hasCotizador = page.getByText(/Selecciona el tipo de máquina|Tus ítems/i);
        await expect(hasConstruction.or(hasCotizador)).toBeVisible({ timeout: 10_000 });
    });

    test('si hay cotizador visible, el botón Continuar existe en el sidebar', async ({ page }) => {
        await page.goto('/cotizar');
        const continuar = page.getByRole('button', { name: /Continuar/i });
        const underConstruction = page.getByText(/Volveremos a encender motores/i);
        const constructionVisible = await underConstruction.isVisible().catch(() => false);
        if (!constructionVisible) {
            await expect(continuar).toBeVisible({ timeout: 5000 });
        }
    });
});
