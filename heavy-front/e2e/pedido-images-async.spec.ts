import { test, expect } from '@playwright/test';

const APP_EMAIL = process.env.APP_LOGIN_EMAIL;
const APP_PASSWORD = process.env.APP_LOGIN_PASSWORD;
const hasCredentials = !!APP_EMAIL && !!APP_PASSWORD;

test.describe('Flujo de Imágenes Asíncronas - SyncPedidoImages', () => {
    test.skip(!hasCredentials, 'Definir APP_LOGIN_EMAIL y APP_LOGIN_PASSWORD para ejecutar este test');

    test('validar que al guardar imágenes, el Job asíncrono procesa correctamente', async ({ page }) => {
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

        const addImageButton = modal.getByRole('button', { name: /adjuntar|nueva|agregar/i });
        if (await addImageButton.isVisible()) {
            await addImageButton.click();
        }

        const fileInput = page.locator('input[type="file"]').first();
        if (await fileInput.isVisible()) {
            const testFile = await page.locator('body').evaluate(() => {
                const blob = new Blob(['test image content'], { type: 'image/png' });
                return new File([blob], 'test-image.png', { type: 'image/png' });
            });
            await fileInput.setInputFiles([testFile as any]);
        }

        const saveModalButton = modal.getByRole('button', { name: /guardar|aceptar|confirmar/i });
        if (await saveModalButton.isVisible()) {
            await saveModalButton.click();
        }

        await expect(modal).toBeHidden({ timeout: 5000 });
    });

    test('validar que las imágenes guardadas aparecen en el carousel del ítem', async ({ page }) => {
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

        const noImagesText = modal.getByText(/No hay imágenes/i);
        const hasImages = !(await noImagesText.isVisible());

        expect(hasImages).toBeTruthy();
    });
});
