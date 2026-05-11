import { test, expect } from '@playwright/test';

test.describe('Issue 101 - Agrupación de Items en Análisis', () => {
    test.beforeEach(async ({ page }) => {
        // Simular autenticación
        await page.addInitScript(() => {
            const user = {
                id: 1,
                name: 'Analista Test',
                roles: ['Analista']
            };
            window.localStorage.setItem('access_token', 'fake-token');
            window.localStorage.setItem('current_user', JSON.stringify(user));
        });

        // Mock de la API
        await page.route('**/v1/**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();

            if (url.includes('/v1/pedidos/101') && method === 'GET') {
                return route.fulfill({
                    json: {
                        data: {
                            id: 101,
                            estado: 'En_Analisis',
                            referencias: [
                                {
                                    id: 1001,
                                    sistema_id: 1,
                                    lista_id: 1,
                                    referencia_id: 501,
                                    definicion: 'Item Repetido',
                                    cantidad: 1,
                                    lista: { id: 1, nombre: 'Tipo A' }
                                },
                                {
                                    id: 1002,
                                    sistema_id: 1,
                                    lista_id: 1,
                                    referencia_id: 502,
                                    definicion: 'Item Repetido',
                                    cantidad: 2, // DIFERENTE CANTIDAD
                                    lista: { id: 1, nombre: 'Tipo A' }
                                },
                                {
                                    id: 1003,
                                    sistema_id: 2,
                                    lista_id: 2,
                                    referencia_id: 503,
                                    definicion: 'Item Agrupado',
                                    cantidad: 5,
                                    lista: { id: 2, nombre: 'Tipo B' }
                                },
                                {
                                    id: 1004,
                                    sistema_id: 2,
                                    lista_id: 2,
                                    referencia_id: 503, // MISMA REFERENCIA PARA AGRUPAR
                                    definicion: 'Item Agrupado',
                                    cantidad: 5, // MISMA CANTIDAD
                                    lista: { id: 2, nombre: 'Tipo B' }
                                }
                            ]
                        }
                    }
                });
            }

            // Catálogos
            if (url.includes('/v1/sistemas') && method === 'GET') {
                return route.fulfill({
                    json: {
                        data: [
                            { id: 1, nombre: 'SISTEMA 1' },
                            { id: 2, nombre: 'SISTEMA 2' }
                        ]
                    }
                });
            }
            if (url.includes('/v1/listas/tipo/') && method === 'GET') {
                return route.fulfill({
                    json: {
                        data: [
                            { id: 1, nombre: 'Tipo A' },
                            { id: 2, nombre: 'Tipo B' }
                        ]
                    }
                });
            }
            if (url.includes('/v1/referencias') && method === 'GET') {
                return route.fulfill({
                    json: { data: [], meta: { total: 0 } }
                });
            }

            return route.fulfill({ status: 200, json: { data: [] } });
        });
    });

    test('Debe mostrar ítems separados si tienen diferentes cantidades (Issue 101)', async ({ page }) => {
        await page.goto('/app/pedidos/101/analysis');

        // Esperar a que carguen las tarjetas
        // Ahora deberíamos tener 4 tarjetas (una por cada ID diferente en el mock)
        // Antes se agrupaban por metadata, pero ahora r.id es parte de la clave
        const itemCards = page.locator('.item-card');
        await expect(itemCards).toHaveCount(4);

        // Verificar contenidos específicos
        await expect(itemCards.nth(0)).toContainText('Item Repetido');
        await expect(itemCards.nth(0)).toContainText('Cant. 1');

        await expect(itemCards.nth(1)).toContainText('Item Repetido');
        await expect(itemCards.nth(1)).toContainText('Cant. 2');

        await expect(itemCards.nth(2)).toContainText('Item Agrupado');
        await expect(itemCards.nth(2)).toContainText('Cant. 5');

        await expect(itemCards.nth(3)).toContainText('Item Agrupado');
        await expect(itemCards.nth(3)).toContainText('Cant. 5');
    });
});
