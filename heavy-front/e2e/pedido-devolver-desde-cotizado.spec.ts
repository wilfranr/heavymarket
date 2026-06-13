import { test, expect } from '@playwright/test';

test.describe('Devoluciones desde Cotizado', () => {
    test('muestra botones de devolucion en estado Cotizado', async ({ page }) => {
        await page.route('**/api/v1/pedidos/*', async (route) => {
            await route.fulfill({
                json: {
                    data: {
                        id: 100,
                        estado: 'Cotizado',
                        tercero: { nombre: 'Cliente Test' },
                        user: { name: 'Vendedor Test' },
                        referencias: [],
                        articulos: [],
                        comentario: [],
                        created_at: '2026-06-13T10:00:00Z',
                        updated_at: '2026-06-13T12:00:00Z'
                    }
                }
            });
        });

        await page.goto('/app/pedidos/100');

        await expect(page.getByText('Devolver a costeo')).toBeVisible();
        await expect(page.getByText('Devolver al analista')).toBeVisible();
    });

    test('oculta botones de devolucion en estado no Cotizado', async ({ page }) => {
        await page.route('**/api/v1/pedidos/*', async (route) => {
            await route.fulfill({
                json: {
                    data: {
                        id: 101,
                        estado: 'En_Costeo',
                        tercero: { nombre: 'Cliente Test' },
                        user: { name: 'Vendedor Test' },
                        referencias: [],
                        articulos: [],
                        comentario: [],
                        created_at: '2026-06-13T10:00:00Z',
                        updated_at: '2026-06-13T12:00:00Z'
                    }
                }
            });
        });

        await page.goto('/app/pedidos/101');

        await expect(page.getByText('Devolver a costeo')).not.toBeVisible();
        await expect(page.getByText('Devolver al analista')).not.toBeVisible();
    });

    test('abre dialog de devolucion al hacer clic en Devolver a costeo', async ({ page }) => {
        await page.route('**/api/v1/pedidos/*', async (route) => {
            await route.fulfill({
                json: {
                    data: {
                        id: 102,
                        estado: 'Cotizado',
                        tercero: { nombre: 'Cliente Test' },
                        user: { name: 'Vendedor Test' },
                        referencias: [],
                        articulos: [],
                        comentario: [],
                        created_at: '2026-06-13T10:00:00Z',
                        updated_at: '2026-06-13T12:00:00Z'
                    }
                }
            });
        });

        await page.goto('/app/pedidos/102');

        await page.getByText('Devolver a costeo').click();

        await expect(page.getByText('Devolver a Costeo')).toBeVisible();
        await expect(page.getByText('El pedido volvera a la fase de costeo')).toBeVisible();
        await expect(page.locator('textarea#devolver-comentario')).toBeVisible();
    });

    test('abre dialog de devolucion al hacer clic en Devolver al analista', async ({ page }) => {
        await page.route('**/api/v1/pedidos/*', async (route) => {
            await route.fulfill({
                json: {
                    data: {
                        id: 103,
                        estado: 'Cotizado',
                        tercero: { nombre: 'Cliente Test' },
                        user: { name: 'Vendedor Test' },
                        referencias: [],
                        articulos: [],
                        comentario: [],
                        created_at: '2026-06-13T10:00:00Z',
                        updated_at: '2026-06-13T12:00:00Z'
                    }
                }
            });
        });

        await page.goto('/app/pedidos/103');

        await page.getByText('Devolver al analista').click();

        await expect(page.getByText('Devolver al Analista')).toBeVisible();
        await expect(page.getByText('El pedido volvera al analista')).toBeVisible();
    });
});
