# feat: Depuración de faltantes definitivos en la Orden de Trabajo

**Tipo:** Feature
**Prioridad:** Alta
**Módulo:** Órdenes de Trabajo (Backend + Frontend)
**Dependencias:** Ninguna (puede desarrollarse en paralelo con el issue 01)
**Issue relacionado:** Epic [flujo-ot-facturacion](README.md)

---

## Contexto

El cliente describe un paso de manejo de excepciones: cuando una OC se cancela o un proveedor no puede reponer una pieza dañada, el **Asesor** debe poder marcar esos ítems como "faltante definitivo" (`Depurar Faltantes`), excluirlos de la meta de la orden y dejar constancia de que no se le cobrarán al cliente.

Este concepto **no existe en ningún punto del código actual**. Se buscó explícitamente `depura`, `faltante`, `Depurar` en `heavy-api/app` y `heavy-front/src` y no hay ninguna coincidencia relacionada con este flujo (los únicos resultados eran de mensajes de validación de otros módulos, sin relación).

## Problema Detectado

1. No existe columna `cantidad_depurada` en `orden_trabajo_referencias`.
2. No existe ningún endpoint para excluir ítems de la meta de la OT.
3. No existe validación de rol para esta acción — el equivalente al "Asesor" del cliente en el sistema actual es el rol `Vendedor` (ver roles reales en `heavy-api/database/seeders/DevBootstrapSeeder.php:20`: `super_admin, Administrador, Vendedor, Analista, Logistica, Cliente, Proveedor, panel_user`). No hay rol `Asesor` ni `Contabilidad`.
4. No hay modal de confirmación ni advertencia al usuario sobre las consecuencias de depurar un ítem.

## Propuesta

### Backend

1. **Migración:** agregar columna `cantidad_depurada` (integer, default `0`) y `motivo_depuracion` (nullable text) a `orden_trabajo_referencias`. Agregar también `depurado_por` (nullable FK a `users`) y `depurado_at` (nullable timestamp) para trazabilidad de quién y cuándo.

2. **Endpoint dedicado** (no reutilizar `update()` genérico, para mantener auditoría y reglas de negocio separadas, siguiendo el mismo patrón que `registrarRecepcionCompra`):
   ```
   PATCH /api/v1/ordenes-trabajo/{orden_trabajo}/referencias/{orden_trabajo_referencia}/depurar
   ```
   Body:
   ```json
   {
     "cantidad_depurada": 2,
     "motivo_depuracion": "Proveedor no puede reponer la pieza dañada"
   }
   ```

3. **`OrdenTrabajoDepuracionService`** (nuevo) con método `depurarFaltante()`:
   - Valida que `cantidad_depurada` solicitada, sumada a lo ya depurado y a lo ya recibido, **no supere** `cantidad_cotizada` de esa línea (`cantidad_recibida + cantidad_depurada <= cantidad_cotizada`).
   - Valida que la OT no esté en un estado terminal (`Completado`, `Cancelado`, o los nuevos estados del issue 03/04 una vez existan).
   - Persiste `cantidad_depurada`, `motivo_depuracion`, `depurado_por`, `depurado_at`.
   - Registra el evento en Engram/log de auditoría del módulo (coherente con `arch/heavy-audit-history`, ya usado para otras decisiones del sistema).
   - Dispara el recálculo de meta/estado de la OT (reutilizando `OrdenTrabajoLifecycleService` del issue 01 — si el issue 01 aún no está implementado, este servicio debe dejarse preparado para conectarse, pero **no bloquea** su propio desarrollo).

4. **Autorización:** solo `Vendedor`, `Administrador` o `super_admin` pueden depurar un ítem (equivalente al rol "Asesor" del cliente). Agregar el método correspondiente en `OrdenTrabajoPolicy` (`heavy-api/app/Policies/OrdenTrabajoPolicy.php`), p. ej. `depurar(User $user, OrdenTrabajo $ot): bool`.

5. **Reversibilidad (a decidir con negocio):** por defecto, este issue implementa la depuración como **irreversible** vía API estándar (solo se podría corregir por un ajuste manual/administrativo fuera de este flujo). Si el cliente pide poder deshacer una depuración, debe tratarse como un issue aparte — no mezclar reglas de reversión aquí para no inflar el alcance.

6. **Tests:**
   - No permite depurar más de lo pendiente (`cantidad_recibida + cantidad_depurada > cantidad_cotizada` → 422).
   - Rol sin permiso (`Logistica`, `Analista`) recibe 403.
   - Depuración exitosa persiste `depurado_por` y `depurado_at`.

### Frontend

1. **Modelo (`orden-trabajo.model.ts`):** agregar `cantidad_depurada`, `motivo_depuracion`, `depurado_por`, `depurado_at` a `OrdenTrabajoReferencia`.

2. **Servicio (`orden-trabajo.service.ts`):** agregar método `depurarReferencia(otId, referenciaId, payload)`.

3. **Vista de detalle/edición:**
   - Botón "Depurar Faltante" visible solo para roles `Vendedor` / `Administrador` / `super_admin` (usar el mismo mecanismo de permisos ya usado en otras vistas, p. ej. directiva o guard de rol existente).
   - Modal de confirmación con el texto exacto que pide el cliente (adaptado a UI del proyecto):
     > "Estos ítems serán excluidos de la orden final y no se le cobrarán al cliente. ¿Desea continuar?"
   - Campo obligatorio de motivo.
   - Reflejar visualmente el ítem depurado (badge distinto al semáforo verde/amarillo/rojo existente — p. ej. gris "Depurado", para no confundirlo con `Cancelado` genérico).

---

## Criterios de Aceptación (Definición de Done)

- [ ] Columnas `cantidad_depurada`, `motivo_depuracion`, `depurado_por`, `depurado_at` agregadas a `orden_trabajo_referencias`.
- [ ] Endpoint `PATCH .../referencias/{id}/depurar` funcional con validación de saldo (no supera lo cotizado).
- [ ] Solo `Vendedor`, `Administrador`, `super_admin` pueden ejecutar la depuración (`OrdenTrabajoPolicy`).
- [ ] Frontend muestra botón, modal de confirmación con motivo obligatorio, y badge visual distinto para ítems depurados.
- [ ] Tests backend cubren: saldo excedido, rol no autorizado, depuración exitosa con auditoría.
- [ ] `php artisan test` sin fallos; `./vendor/bin/pint` sin errores; `ng lint` sin errores.

---

## Archivos afectados (estimación)

**Backend:**
- `database/migrations/xxxx_add_depuracion_columns_orden_trabajo_referencias.php` (nuevo)
- `app/Models/OrdenTrabajoReferencia.php` (modificar)
- `app/Services/OrdenTrabajoDepuracionService.php` (nuevo)
- `app/Http/Requests/DepurarOrdenTrabajoReferenciaRequest.php` (nuevo)
- `app/Http/Controllers/Api/V1/OrdenTrabajoController.php` (modificar — nuevo método `depurarReferencia`)
- `app/Policies/OrdenTrabajoPolicy.php` (modificar)
- `routes/api.php` (agregar ruta)
- `tests/Feature/Api/OrdenTrabajoDepuracionTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-trabajo.model.ts` (modificar)
- `src/app/core/services/orden-trabajo.service.ts` (modificar)
- `src/app/features/ordenes-trabajo/detail/detail.component.ts` (modificar)
- `src/app/features/ordenes-trabajo/edit/edit.component.ts` (modificar)
