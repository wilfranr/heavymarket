import { test, expect } from '@playwright/test';

test.describe('Flujo Automatizado de Cotización - Módulo de Costeo', () => {

    test('Debe permitir seleccionar proveedores y generar la cotización exitosamente', async ({ page }) => {
        // 1. Mockear la carga del pedido y sus referencias de costeo
        await page.route('**/v1/pedidos/123/costeo', async route => {
            await route.fulfill({
                json: {
                    id: 123,
                    estado: 'En_Analisis',
                    referencias: [
                        {
                            id: 1,
                            definicion: 'FILTRO DE ACEITE',
                            proveedores: [
                                { id: 501, nombre: 'Proveedor A', costo_unidad: 50, valor_unidad: 70, marca: { nombre: 'CAT' } }
                            ]
                        }
                    ]
                }
            });
        });

        // 2. Mockear el endpoint de finalizar costeo
        let capturedPayload: any;
        await page.route('**/v1/cotizaciones/finalizar-costeo', async route => {
            capturedPayload = route.request().postDataJSON();
            await route.fulfill({
                status: 200,
                json: { message: 'Cotización generada exitosamente', id: 999 }
            });
        });

        // 3. Navegar a la pantalla de costeo del pedido
        await page.goto('/app/pedidos/123/costeo');

        // 4. Verificar que se cargó el ítem y el proveedor
        await expect(page.getByText('FILTRO DE ACEITE')).toBeVisible();
        await expect(page.getByText('Proveedor A')).toBeVisible();

        // 5. Simular la selección del proveedor (clic en el radio button o checkbox de selección)
        // Nota: Ajustamos el selector según los componentes de PrimeNG usados en CosteoComponent
        const selector = page.locator('p-radioButton').first();
        await selector.click();

        // 6. Hacer clic en el botón principal "Generar Cotización"
        const generateBtn = page.getByRole('button', { name: /Generar Cotización/i });
        await expect(generateBtn).toBeEnabled();
        await generateBtn.click();

        // 7. Validar que el payload enviado sea correcto
        expect(capturedPayload).toBeDefined();
        expect(capturedPayload.pedido_id).toBe(123);
        expect(capturedPayload.items[0]).toEqual({ id: 501, mostrar_referencia: true });

        // 8. Validar feedback visual de éxito (Toast de PrimeNG)
        await expect(page.getByText('Cotización generada exitosamente')).toBeVisible();
    });
});
