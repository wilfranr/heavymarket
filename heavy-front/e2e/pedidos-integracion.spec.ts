import { test, expect } from '@playwright/test';

test.describe('Integración de Pedidos Modernizada - Mocked API', () => {
  
  test('Validar que el Frontend consume correctamente la nueva estructura de Pedidos', async ({ page }) => {
    // Interceptar la llamada al API de pedidos
    await page.route('**/api/v1/pedidos*', async route => {
      const json = {
        data: [
          {
            id: 42,
            tercero: { nombre: 'Cliente Playwright' },
            estado: 'Nuevo',
            total_referencias: 2,
            referencias: [
              { id: 1, definicion: 'REF-TEST-001', cantidad: 5, valor_unidad: 1200, valor_total: 6000 }
            ],
            created_at: '2026-04-03'
          }
        ],
        meta: { current_page: 1, total: 1 }
      };
      await route.fulfill({ json });
    });

    // Navegar directamente al listado (el mock evita la necesidad de login real para esta prueba de UI/Estructura)
    await page.goto('/pedidos');

    // Validar que la tabla muestra los datos del mock correctamente
    const table = page.locator('table');
    await expect(table).toContainText('Cliente Playwright');
    await expect(table).toContainText('REF-TEST-001');
    
    // Validar el cálculo de valor unidad
    await expect(table).toContainText('1.200');
  });

  test('Verificar envío de nuevo pedido con tipado estricto', async ({ page }) => {
    // Capturar el POST para validar la estructura enviada
    let requestBody: any;
    await page.route('**/api/v1/pedidos', async route => {
      if (route.request().method() === 'POST') {
        requestBody = route.request().postDataJSON();
        await route.fulfill({ status: 201, json: { data: { id: 43 }, message: 'Pedido creado' } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/pedidos/nuevo');
    
    // Llenar formulario (usando selectores genéricos de PrimeNG/Tailwind según AGENTS.md)
    await page.fill('input[placeholder*="Referencia"]', 'REF-NEW-99');
    await page.fill('input[placeholder*="Cantidad"]', '10');
    
    // Simular clic en guardar
    await page.click('button:has-text("Guardar")');

    // Validar que el objeto enviado al API sigue el DTO tipado
    expect(requestBody).toBeDefined();
    // El frontend debe haber enviado 'referencias' como un array, no un objeto suelto
    expect(Array.isArray(requestBody.referencias)).toBeTruthy();
  });
});
