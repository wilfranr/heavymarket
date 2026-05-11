import { test, expect } from '@playwright/test';

/**
 * Tab "Fabricantes" en /app/listas: la tabla debe mostrar filas tras el GET filtrado.
 * Usa localStorage simulado + mock del API para no depender de login real ni backend.
 */
test.describe('Listas – pestaña Fabricantes', () => {
    test('la tabla muestra datos al filtrar por Fabricantes', async ({ page }) => {
        const mockRow = {
            id: 99001,
            tipo: 'Fabricantes',
            nombre: 'Fabricante Mock Playwright',
            definicion: 'Sincronizado desde catálogo',
            foto: null,
            fotoMedida: null,
            sistema_id: null,
            parent_id: null,
            fabricante_id: 42001,
            created_at: '2026-04-04T12:00:00.000000Z',
            updated_at: '2026-04-04T12:00:00.000000Z',
            deleted_at: null,
            fabricante: {
                id: 42001,
                nombre: 'Fabricante Mock Playwright',
                descripcion: 'Sincronizado desde catálogo',
                logo: null,
                created_at: '2026-04-04T12:00:00.000000Z',
                updated_at: '2026-04-04T12:00:00.000000Z'
            }
        };

        const listPayload = {
            data: [mockRow],
            meta: {
                current_page: 1,
                last_page: 1,
                per_page: 10,
                total: 1
            }
        };

        await page.addInitScript(() => {
            localStorage.setItem('access_token', 'playwright-test-token');
            localStorage.setItem(
                'current_user',
                JSON.stringify({
                    id: 1,
                    name: 'Usuario Prueba',
                    email: 'pw@test.local',
                    roles: ['Administrador']
                })
            );
        });

        await page.route('**/v1/listas**', async (route) => {
            if (route.request().method() !== 'GET') {
                await route.continue();
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(listPayload)
            });
        });

        await page.goto('/app/listas');
        await expect(page).toHaveURL(/\/app\/listas/, { timeout: 15_000 });

        await expect(page.getByRole('heading', { name: /Listas \(Catálogos\)/i })).toBeVisible({
            timeout: 15_000
        });

        // PrimeNG sustituye nodos de pestaña al refrescar; clic vía DOM evita "element detached" en Playwright.
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
            const target = tabs.find((t) => (t.textContent || '').includes('Fabricantes'));
            (target as HTMLElement | undefined)?.click();
        });

        // Una sola aserción evita localizadores obsoletos si p-table re-renderiza el tbody tras el GET.
        const fila = page.locator('p-table tbody tr').filter({ hasText: /Fabricante Mock Playwright/i });
        await expect(fila.filter({ hasText: /Fabricantes/ })).toHaveCount(1, { timeout: 10_000 });
    });
});
