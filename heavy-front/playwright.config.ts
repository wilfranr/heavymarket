import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración E2E para HeavyMarket frontend.
 * Ver https://playwright.dev/docs/test-configuration
 *
 * Ejecutar con: npx playwright test
 * Con UI:       npx playwright test --ui
 * Con navegador visible: npx playwright test --headed
 *
 * Credenciales opcionales (para tests que requieren login):
 *   APP_LOGIN_EMAIL, APP_LOGIN_PASSWORD
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4200',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    ],
    webServer: process.env.CI
        ? undefined
        : {
              command: 'npm run start',
              url: 'http://localhost:4200',
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
});
