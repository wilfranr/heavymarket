import { test, expect } from '@playwright/test';

/**
 * Tests E2E para el flujo: login app -> listado pedidos -> editar pedido.
 * Requiere credenciales en env: APP_LOGIN_EMAIL, APP_LOGIN_PASSWORD
 * Si no están definidas, los tests que requieren login se omiten.
 */
const APP_EMAIL = process.env.APP_LOGIN_EMAIL;
const APP_PASSWORD = process.env.APP_LOGIN_PASSWORD;
const hasCredentials = !!APP_EMAIL && !!APP_PASSWORD;

test.describe('Edición de pedido', () => {
    test.skip(!hasCredentials, 'Definir APP_LOGIN_EMAIL y APP_LOGIN_PASSWORD para ejecutar este test');

    test('login y navegación a listado de pedidos', async ({ page }) => {
        await page.goto('/auth/login');
        await expect(page).toHaveURL(/\/auth\/login/);

        await page.getByLabel(/email|correo/i).fill(APP_EMAIL!);
        await page.locator('input[type="password"], .p-password input').fill(APP_PASSWORD!);
        await page.getByRole('button', { name: /iniciar|ingresar|login/i }).click();

        await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15_000 });
        await page.goto('/app/pedidos');
        await expect(page).toHaveURL(/\/app\/pedidos/);
    });

    test('abrir edición del primer pedido y verificar columnas del ítem', async ({ page }) => {
        await page.goto('/auth/login');
        await page.getByLabel(/email|correo/i).fill(APP_EMAIL!);
        await page.locator('input[type="password"], .p-password input').fill(APP_PASSWORD!);
        await page.getByRole('button', { name: /iniciar|ingresar|login/i }).click();
        await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15_000 });

        await page.goto('/app/pedidos');
        await expect(page).toHaveURL(/\/app\/pedidos/);

        // Tabla: primer botón de editar (ícono lápiz). PrimeNG puede usar aria-label o solo ícono
        const editButton = page.locator('button[class*="pencil"], button .pi-pencil').first();
        await editButton.click();

        await expect(page).toHaveURL(/\/app\/pedidos\/\d+\/edit/);

        // Verificar que existe la sección de ítems con Sistema y Tipo de artículo
        await expect(page.getByText('Sistema', { exact: true }).or(page.getByText('Tipo de artículo'))).toBeVisible({ timeout: 10_000 });
        // Verificar que hay al menos un select de sistema o un placeholder "Tipo de artículo"
        const sistemaHeader = page.locator('text=Sistema').first();
        const tipoHeader = page.locator('text=Tipo de artículo').first();
        await expect(sistemaHeader.or(tipoHeader)).toBeVisible();

        // Verificar que existe el botón de imágenes (icono o tooltip "Ver imágenes" / "Adjuntar")
        const imageButton = page.getByRole('button', { name: /imágenes|adjuntar|image/i }).first();
        await expect(imageButton).toBeVisible();
    });

    test('modal de imágenes se abre al hacer clic en el botón de imagen del ítem', async ({ page }) => {
        await page.goto('/auth/login');
        await page.getByLabel(/email|correo/i).fill(APP_EMAIL!);
        await page.locator('input[type="password"], .p-password input').fill(APP_PASSWORD!);
        await page.getByRole('button', { name: /iniciar|ingresar|login/i }).click();
        await expect(page).toHaveURL(/\/(app|dashboard)/, { timeout: 15_000 });

        await page.goto('/app/pedidos');
        const editButton = page.locator('button[class*="pencil"], button .pi-pencil').first();
        await editButton.click();
        await expect(page).toHaveURL(/\/app\/pedidos\/\d+\/edit/);

        const imageButton = page.getByRole('button', { name: /imágenes|adjuntar|image/i }).first();
        await imageButton.click();

        const modal = page.getByRole('dialog').filter({ hasText: /imágenes del ítem|Imágenes del ítem/i });
        await expect(modal).toBeVisible({ timeout: 5000 });
        await expect(modal.getByText(/No hay imágenes|Cerrar|Vista previa/i)).toBeVisible();
    });
});
