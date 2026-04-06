# Recuperación de Memoria - Módulo Pedidos
**Proyecto:** HeavyMarket
**Fecha:** 2026-04-04

## 1. Refactorización Backend (Laravel)
- **Cambio:** Se migró la lógica de `PedidoController` a `App\Services\PedidoService`.
- **Procesamiento Asíncrono:** El proceso de imágenes en `syncReferencias` ahora es un Job asíncrono (`SyncPedidoImages`).
- **Métodos movidos:** `calcularValores` y `syncReferencias`.
- **Corner Cases resueltos:**
    - Se añadió validación para `peso = 0` en referencias (evita fallos en flete).
    - Se añadió fallback `TRM = 1` si la base de datos devuelve nulo.
    - Se normalizaron fletes negativos a 0.

## 2. Refactorización Frontend (Angular)
- **Cambio:** Tipado estricto en `PedidoService`. Se eliminaron los `any`.
- **Manejo de Errores:** Se delegó al interceptor global de Angular.

## 3. Pruebas y Validación (QA)
- **E2E:** Implementado `pedido-images-async.spec.ts` en Playwright para validar el flujo asíncrono y la visualización en carrusel.
- **Resultado:** ✅ Funcionalidad validada visualmente.

## 4. Deuda Técnica Pendiente
- (Vacío - Tareas actuales completadas)
