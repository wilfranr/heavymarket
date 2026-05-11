import { test, expect } from '@playwright/test';

test.describe('Crear Pedido Sin Referencias - Issue #73', () => {
    test('debe permitir crear pedido sin referencias cuando estado es Nuevo', async ({ page }) => {
        let requestBody: any;

        await page.route('**/api/v1/pedidos', async (route) => {
            if (route.request().method() === 'POST') {
                requestBody = route.request().postDataJSON();
                await route.fulfill({
                    status: 201,
                    json: {
                        data: {
                            id: 100,
                            estado: 'Nuevo',
                            referencias_count: 0
                        },
                        message: 'Pedido creado'
                    }
                });
            } else {
                await route.continue();
            }
        });

        // Navegar directly to creation page
        await page.goto('/pedidos/nuevo');

        // Select a client (tercero) - using a p-select
        await page.click('p-select[formcontrolname="tercero_id"]');
        await page.waitForTimeout(300);
        await page.click('.p-select-option:first-child');

        // Ensure estado is "Nuevo" (default)
        const estadoValue = await page.inputValue('input[formcontrolname="estado"]');
        expect(estadoValue).toBe('Nuevo');

        // Click guardar WITHOUT adding any references
        await page.click('button:has-text("Guardar")');

        // Wait for API call
        await page.waitForTimeout(500);

        // Verify the request was made successfully (not blocked by validation)
        expect(requestBody).toBeDefined();
        expect(requestBody.tercero_id).toBeDefined();
        expect(requestBody.estado).toBe('Nuevo');

        // Verify NO referencias were sent (empty array or undefined)
        expect(requestBody.referencias === undefined || requestBody.referencias.length === 0).toBeTruthy();
    });

    test('debe requerir referencias cuando estado NO es Nuevo', async ({ page }) => {
        await page.goto('/pedidos/nuevo');

        // Select a client
        await page.click('p-select[formcontrolname="tercero_id"]');
        await page.waitForTimeout(300);
        await page.click('.p-select-option:first-child');

        // Change estado to "Enviado" (not Nuevo)
        await page.click('p-select[formcontrolname="estado"]');
        await page.waitForTimeout(300);
        await page.click('.p-select-option:has-text("Enviado")');

        // Try to save without references - should show validation error
        await page.click('button:has-text("Guardar")');

        // Should show warning about requiring referencias
        await expect(page.locator('p-message, .p-message, toast')).toContainText(/referencia/i);
    });
});
