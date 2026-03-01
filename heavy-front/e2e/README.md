# Tests E2E con Playwright

Los tests E2E abren el navegador y validan flujos de la aplicación.

## Requisitos

- Frontend corriendo en `http://localhost:4200` (o definir `PLAYWRIGHT_BASE_URL`)
- Para tests de pedidos: API corriendo y credenciales de usuario de la app

## Ejecutar

```bash
cd heavy-front

# Todos los tests (Chromium, Firefox, WebKit). El servidor se levanta solo si no está corriendo.
npm run e2e

# Solo Chromium, con interfaz de Playwright
npm run e2e:ui

# Con el navegador visible (no headless)
npm run e2e:headed

# Solo tests de la página Cotizar (no requieren login)
npx playwright test cotizar

# Tests de edición de pedido (requieren credenciales)
APP_LOGIN_EMAIL=tu@email.com APP_LOGIN_PASSWORD=tupassword npx playwright test pedido-edit
```

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `PLAYWRIGHT_BASE_URL` | URL del frontend (por defecto `http://localhost:4200`) |
| `APP_LOGIN_EMAIL` | Email del usuario de la app (admin/vendedor) para tests de pedidos |
| `APP_LOGIN_PASSWORD` | Contraseña del usuario de la app |

Si `APP_LOGIN_EMAIL` y `APP_LOGIN_PASSWORD` no están definidas, los tests en `e2e/pedido-edit.spec.ts` se omiten.

## Estructura

- `e2e/cotizar.spec.ts`: carga de la página Cotizar (con o sin usuario cliente).
- `e2e/pedido-edit.spec.ts`: login en la app, listado de pedidos, edición del primer pedido y comprobación de columnas (Sistema, Tipo de artículo, Referencia) y del modal de imágenes.

## Instalar navegadores (primera vez)

```bash
npx playwright install
```

## Ver reporte tras un run

```bash
npx playwright show-report
```
