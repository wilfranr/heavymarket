import { test, expect } from '@playwright/test';

test.describe('Análisis de Pedido - Carga Masiva Contextual', () => {

  test.beforeEach(async ({ page }) => {
    // Ver logs del navegador
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`BROWSER ERROR: ${msg.text()}`);
      }
    });

    // Simular autenticación robusta
    await page.addInitScript(() => {
      const user = {
        id: 1,
        name: 'Analista Test',
        email: 'analista@test.com',
        roles: ['Analista', 'analista']
      };
      window.localStorage.setItem('access_token', 'fake-token');
      window.localStorage.setItem('current_user', JSON.stringify(user));
    });

    // Mock global de la API para evitar 401s y redirecciones
    await page.route('**/v1/**', async route => {
      const url = route.request().url();
      const method = route.request().method();

      // Pedido específico
      if (url.includes('/v1/pedidos/42') && method === 'GET') {
        return route.fulfill({
          json: {
            data: {
              id: 42,
              estado: 'Analisis',
              maquina: { marca: 'CAT', modelo: '320D', fabricante_id: 1 },
              referencias: [
                {
                  id: 101,
                  referencia_id: 501,
                  sistema_id: 1,
                  lista_id: 2,
                  definicion: 'Bomba Hidráulica',
                  cantidad: 1,
                  referencia: { id: 501, referencia: '123-4567', articulo: { definicion: 'Bomba', es_pieza_estandar: true } }
                }
              ]
            }
          }
        });
      }

      // Sistemas
      if (url.includes('/v1/sistemas') && method === 'GET') {
        return route.fulfill({
          json: { data: [{ id: 1, nombre: 'HIDRAULICO' }] }
        });
      }

      // Listas por tipo
      if (url.includes('/v1/listas/tipo/') && method === 'GET') {
        return route.fulfill({
          json: { data: [{ id: 2, nombre: 'REPUESTOS', tipo: 'Categoría Comercial' }] }
        });
      }

      // Carga Masiva (POST)
      if (url.includes('/v1/referencias/bulk-search-or-create') && method === 'POST') {
        return route.fulfill({
          json: {
            data: [
              {
                codigo: '999-0001',
                cantidad: 2,
                referencia_id: 601,
                referencia: {
                  id: 601,
                  referencia: '999-0001',
                  articulo: { definicion: 'Sello O-Ring', es_pieza_estandar: true }
                }
              }
            ]
          }
        });
      }

      // Mock de referencias vacío o con datos base
      if (url.includes('/v1/referencias') && method === 'GET') {
        return route.fulfill({
          json: { data: [], meta: { total: 0 } }
        });
      }

      // Fallback para cualquier otra ruta de la API (notificaciones, stats, etc)
      return route.fulfill({
        status: 200,
        json: { data: [], message: 'Mock fallback' }
      });
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      console.log(`Test "${testInfo.title}" falló en URL: ${page.url()}`);
    }
  });

  test('Debe ocultar el botón de carga masiva global y permitir carga contextual en ítem', async ({ page }) => {
    // Navegar y esperar a estar realmente en la página de análisis
    await page.goto('/app/pedidos/42/analysis');
    
    // Validar que no fuimos redirigidos a /app o /login
    await expect(page).toHaveURL(/.*analysis/);

    // Esperar a que el ítem del pedido cargue en el DOM
    const itemCard = page.locator('.item-card');
    await expect(itemCard).toBeVisible({ timeout: 15000 });

    // 1. Validar que el botón global NO está visible (está comentado)
    const allBulkButtons = page.locator('button:has-text("Agregar listado")');
    await expect(allBulkButtons).toHaveCount(1);

    const itemBulkBtn = itemCard.locator('button:has-text("Agregar listado")');
    await expect(itemBulkBtn).toBeVisible();

    // 2. Abrir carga masiva desde el ítem
    await itemBulkBtn.click();

    // 3. Validar mensaje de contexto en el panel de importación
    const importPanel = page.locator('.theme-card');
    await expect(importPanel).toBeVisible();
    await expect(importPanel).toContainText('Importando al ítem: HIDRAULICO — REPUESTOS');

    // 4. Ingresar datos y procesar
    await page.fill('textarea', '2 999-0001');
    await page.click('button:has-text("Procesar listado")');

    // 5. Verificar que se agregó una fila a la tabla del ítem (1 original + 1 nueva)
    const rows = page.locator('tr.item-row-bg');
    await expect(rows).toHaveCount(2);
    // Verificamos por la descripción que devuelve el mock de carga masiva
    await expect(rows.last()).toContainText('Sello O-Ring');
  });

  test('Debe permitir cancelar la carga masiva y limpiar el contexto', async ({ page }) => {
    await page.goto('/app/pedidos/42/analysis');
    await expect(page.locator('.item-card')).toBeVisible({ timeout: 15000 });

    await page.click('button:has-text("Agregar listado")');
    await expect(page.locator('.theme-card')).toBeVisible();

    await page.click('button:has-text("Cancelar")');
    await expect(page.locator('.theme-card')).not.toBeVisible();

    // Validar que al abrir un diálogo distinto (Agregar ítem), el panel de carga masiva no está presente
    await page.click('button:has-text("Agregar ítem")');
    await expect(page.locator('h4:has-text("Importación Masiva")')).not.toBeVisible();
  });
});
