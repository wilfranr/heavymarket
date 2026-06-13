import { Page, expect } from '@playwright/test';

/**
 * Helper para mockear el estado de autenticación y el rol del usuario
 */
export async function mockUserRole(page: Page, role: string) {
    // Interceptar llamadas al endpoint del usuario actual para retornar el rol simulado
    await page.route('**/api/v1/auth/user', async (route) => {
        await route.fulfill({
            status: 200,
            json: {
                data: {
                    id: 1,
                    name: `Usuario ${role}`,
                    email: `${role.toLowerCase()}@heavymarket.com`,
                    roles: [role]
                }
            }
        });
    });

    // Mockear también la carga inicial o perfil general de autenticación si aplica
    await page.route('**/api/v1/user', async (route) => {
        await route.fulfill({
            status: 200,
            json: {
                id: 1,
                name: `Usuario ${role}`,
                email: `${role.toLowerCase()}@heavymarket.com`,
                roles: [role]
            }
        });
    });
}

/**
 * Helper para verificar si el modo oscuro está activo
 */
export async function isDarkModeActive(page: Page): Promise<boolean> {
    const html = page.locator('html');
    return await html.evaluate((node) => node.classList.contains('app-dark'));
}

/**
 * Helper para alternar el modo oscuro desde la interfaz de usuario
 */
export async function toggleDarkModeViaUI(page: Page) {
    const toggleButton = page.locator('.layout-config-menu button, .layout-topbar-actions button .pi-sun, .layout-topbar-actions button .pi-moon').first();
    await toggleButton.click();
}
