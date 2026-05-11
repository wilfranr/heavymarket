import { test, expect } from '@playwright/test';

test.describe('Gestión de Maquinaria y Componentes', () => {
    test.beforeEach(async ({ page }) => {
        // Simular autenticación
        await page.addInitScript(() => {
            const user = {
                id: 1,
                name: 'Administrador Test',
                roles: ['Administrador']
            };
            window.localStorage.setItem('access_token', 'fake-token');
            window.localStorage.setItem('current_user', JSON.stringify(user));
            // Prevenir diálogos de confirmación nativos
            window.confirm = () => true;
        });

        // Mock de la API
        await page.route('**/v1/**', async (route) => {
            const url = route.request().url();
            const method = route.request().method();

            // Listado de máquinas
            if (url.includes('/v1/maquinas') && method === 'GET' && !url.match(/\/maquinas\/\d+/)) {
                return route.fulfill({
                    json: {
                        data: [{ id: 1, modelo: 'Excavadora CAT 320', serie: 'CAT123', estado_revision: 'revisado' }],
                        meta: { current_page: 1, total: 1 }
                    }
                });
            }

            // Detalle de máquina
            if (url.match(/\/maquinas\/\d+/) && method === 'GET') {
                return route.fulfill({
                    json: {
                        data: {
                            id: 1,
                            tipo: 1,
                            fabricante_id: 1,
                            modelo: 'Excavadora CAT 320',
                            serie: 'CAT123',
                            estado_revision: 'revisado',
                            componentes: [{ id: 101, sistema_id: 1, modelo: 'Motor C7.1', serie: 'MOT999', comentario: 'Motor original' }]
                        }
                    }
                });
            }

            // Crear máquina
            if (url.includes('/v1/maquinas') && method === 'POST') {
                return route.fulfill({
                    status: 201,
                    json: { data: { id: 2 }, message: 'Máquina creada correctamente' }
                });
            }

            // Catálogos
            if (url.includes('/v1/listas') && url.includes('tipo=Tipo%20de%20M%C3%A1quina')) {
                return route.fulfill({ json: { data: [{ id: 1, nombre: 'Excavadora' }] } });
            }
            if (url.includes('/v1/fabricantes')) {
                return route.fulfill({ json: { data: [{ id: 1, nombre: 'Caterpillar' }] } });
            }
            if (url.includes('/v1/sistemas')) {
                return route.fulfill({ json: { data: [{ id: 1, nombre: 'Motor' }] } });
            }
            if (url.includes('/v1/listas') && url.includes('marcas-y-fabricantes')) {
                return route.fulfill({ json: [{ id: 1, nombre: 'CAT' }] });
            }

            return route.fulfill({ status: 200, json: { data: [] } });
        });
    });

    test('Debe listar las máquinas existentes', async ({ page }) => {
        await page.goto('/app/maquinas');
        await expect(page.getByText('Excavadora CAT 320').first()).toBeVisible({ timeout: 10000 });
    });

    test('Debe permitir crear una máquina con un componente y usar acciones', async ({ page }) => {
        await page.goto('/app/maquinas/create');

        // Llenar info básica
        await page.locator('#tipo').waitFor({ state: 'visible' });

        // Tipo (Select)
        await page.locator('#tipo').click();
        // Usar exact: true para evitar problemas con labels que contienen el mismo texto
        await page.getByRole('option', { name: 'Excavadora', exact: true }).click();

        // Fabricante (Select)
        await page.locator('#fabricante_id').click();
        await page.getByRole('option', { name: 'Caterpillar', exact: true }).click();

        // Modelo
        await page.locator('#modelo').fill('CAT 336');

        // Serie
        await page.locator('#serie').fill('SERIE555');

        // Agregar componente
        await page.getByRole('button', { name: /Agregar Componente/i }).click();

        // Esperar a que el FormArray se actualice
        const row = page.locator('div[formgroupname="0"]');
        await expect(row).toBeVisible();

        // Llenar info de componente
        await row.locator('p-select[formControlName="sistema_id"]').click();
        await page.getByRole('option', { name: 'Motor', exact: true }).click();

        await row.locator('input[formControlName="modelo"]').fill('Motor C9');

        // Probar duplicar
        await row.locator('p-button[icon="pi pi-copy"]').click();
        // Debería haber una segunda fila
        const row2 = page.locator('div[formgroupname="1"]');
        await expect(row2).toBeVisible();
        await expect(row2.locator('input[formControlName="modelo"]')).toHaveValue('Motor C9');

        // Probar comentario en popover en la segunda fila
        await row2.locator('p-button[icon="pi pi-comment"]').click();
        const popover = page.locator('p-popover');
        await expect(popover).toBeVisible();
        await popover.locator('textarea').fill('Este es un comentario de prueba');

        // Cerrar popover haciendo click en el título del card
        await page.getByText('Gestión Técnica').first().click();

        // Submit
        const saveBtn = page.getByRole('button', { name: /Confirmar Registro/i });
        await saveBtn.click();

        // Debería redirigir al listado
        await expect(page).toHaveURL(/\/maquinas/);
    });

    test('Debe mostrar el detalle de una máquina y sus componentes', async ({ page }) => {
        await page.goto('/app/maquinas/1');

        await expect(page.getByText('Excavadora CAT 320').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Motor C7.1')).toBeVisible();
        await expect(page.getByText('Motor original')).toBeVisible();
    });
});
