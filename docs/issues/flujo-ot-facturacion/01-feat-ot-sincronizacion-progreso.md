# feat: Sincronizar recepción de Órdenes de Compra con el progreso de la Orden de Trabajo

**Tipo:** Feature
**Prioridad:** Alta
**Módulo:** Órdenes de Trabajo (Backend + Frontend)
**Dependencias:** Ninguna
**Issue relacionado:** Epic [flujo-ot-facturacion](README.md)

---

## Contexto

El cliente describe la Orden de Trabajo (OT) como un motor automático: cada vez que Logística recibe/aprueba una Orden de Compra (OC), el sistema debe sumar esas cantidades a las líneas de la OT y mostrar una barra de progreso / semáforo (`"Entregado: 45 de 100 repuestos"`).

Hoy ese motor no existe para la OT. Sí existe un motor equivalente, pero **solo a nivel de OC**: `RecepcionCompraService::crearRecepcionConDetalles()` (`heavy-api/app/Services/RecepcionCompraService.php:120`) actualiza `orden_compra_referencia.cantidad_recibida` y dispara `OrdenCompraLifecycleService::actualizarEstadoPorRecepciones()`, que transiciona el estado de la **OC**. Nunca toca `orden_trabajo_referencias`.

## Problema Detectado

1. **Campo muerto:** `orden_trabajo_referencias.cantidad_recibida` existe en la migración (`2026_05_05_000001_create_orden_trabajos_tables.php:55`), en el modelo `OrdenTrabajoReferencia` y en `OrdenTrabajoReferenciaResource:34`, pero **ningún controlador o servicio lo escribe**. Siempre queda en `0` (el valor con el que se crea en `CotizacionService::crearOrdenTrabajo()`, línea 283).
2. **Nombre ambiguo:** la columna `cantidad` en `orden_trabajo_referencias` representa lo cotizado/target, pero no se llama `cantidad_cotizada`, lo que genera confusión frente al vocabulario que usa el cliente (y frente al de OC, que sí usa `cantidad_recibida` de forma consistente).
3. **Sin barra de progreso:** ni `detail.component.ts` ni `edit.component.ts` de `ordenes-trabajo` calculan ni muestran un porcentaje de avance. El semáforo actual por ítem depende del campo `estado` de `orden_trabajo_referencias`, que también se setea manualmente (no hay endpoint que lo actualice desde recepción).
4. **Estado general manual:** el estado de la OT (`Pendiente`, `En Proceso`, `Completado`, `Cancelado`) solo cambia vía `PUT /v1/ordenes-trabajo/{id}` (`OrdenTrabajoController::update()`), decisión humana. El cliente espera que el sistema lo mueva a `En Progreso / Recepción Parcial` automáticamente en cuanto entra la primera recepción.

## Propuesta

### Backend

1. **Migración:** renombrar `orden_trabajo_referencias.cantidad` → `cantidad_cotizada` (mantener el mismo tipo/default). Actualizar:
   - `App\Models\OrdenTrabajoReferencia::$fillable`
   - `CotizacionService::crearOrdenTrabajo()` (línea 282, `'cantidad' => $prp->cantidad` → `'cantidad_cotizada' => $prp->cantidad`)
   - `OrdenTrabajoReferenciaResource`
   - Cualquier vista/consulta que use `->cantidad` sobre este modelo (grep antes de tocar: `grep -rn "orden_trabajo_referencias\|OrdenTrabajoReferencia" heavy-api/app`).

2. **Resolución de la OT vinculada a una recepción:** en `RecepcionCompraService`, tanto `registrarDesdeOrdenTrabajo` (ya trae `$ordenTrabajo`) como `registrarDesdeOrdenCompra` (hoy no exige OT) deben poder resolver la OT operativa asociada a la `OrdenCompra` recibida, usando el mismo criterio que ya aplica `validarRelacionOperativa()` (mismo `pedido_id` o `cotizacion_id`).

3. **Sincronizar `cantidad_recibida` en `orden_trabajo_referencias`:** agregar un método (p. ej. `sincronizarProgresoOrdenTrabajo(OrdenTrabajo $ot, Collection $referenciaIds)`) que, para cada `referencia_id` recibido en la OC:
   - Ubique la `OrdenTrabajoReferencia` correspondiente (join vía `pedidoReferencia.referencia_id` == `referencia_id` de la OC, dentro de la misma OT).
   - Recalcule `cantidad_recibida` como la suma de `cantidad_conforme` de todas las recepciones activas para esa referencia dentro del alcance de la OT (mismo patrón que `sincronizarAcumuladorCantidadRecibida()` en `RecepcionCompraService.php:164`, pero apuntando a la tabla de OT).
   - Actualice el `estado` del ítem: `Pendiente` (0 recibido) → `Recibido` (recibido ≥ cotizado). No tocar acá el estado `Cancelado` (eso pertenece al issue 02, Depuración).
   - Invocar esto dentro de la misma transacción de `crearRecepcionConDetalles()`, justo después de `actualizarEstadoPorRecepciones()`.

4. **Estado general de la OT:** crear (o extender) un `OrdenTrabajoLifecycleService` (paralelo al que ya existe para OC) con un método `actualizarEstadoPorProgreso(OrdenTrabajo $ot)`:
   - Si `SUM(cantidad_recibida) == 0` en todas las referencias → mantiene `Pendiente`.
   - Si `0 < SUM(cantidad_recibida) < SUM(cantidad_cotizada)` → `En Proceso`.
   - Si `SUM(cantidad_recibida) == SUM(cantidad_cotizada)` → lo deja listo para que el issue 03 (cierre técnico) decida el estado final; este issue **no** debe introducir el estado `Completado` todavía, porque la fórmula completa de cierre depende también de `cantidad_depurada` (issue 02).
   - Este servicio se invoca desde el mismo flujo de recepción, después de sincronizar cantidades.

5. **Exponer progreso calculado en el API:** agregar a `OrdenTrabajoResource` un bloque `progreso`:
   ```json
   "progreso": {
     "cotizado": 100,
     "recibido": 45,
     "porcentaje": 45
   }
   ```
   (el porcentaje se recalcula on-the-fly desde las referencias cargadas, no se persiste como columna).

6. **Tests:**
   - Feature test: registrar una recepción desde OC vinculada a una OT y verificar que `orden_trabajo_referencias.cantidad_recibida` se actualiza correctamente.
   - Feature test: recepción parcial vs. completa y su efecto en `orden_trabajo_referencias.estado` y en el estado general de la OT.
   - Test de regresión: `registrarDesdeOrdenCompra` sin OT asociada no debe fallar (debe tolerar que no exista una OT vinculada, sin lanzar excepción).

### Frontend

1. **Modelo (`orden-trabajo.model.ts`):**
   - Renombrar `cantidad` → `cantidad_cotizada` en `OrdenTrabajoReferencia`.
   - Agregar bloque `progreso?: { cotizado: number; recibido: number; porcentaje: number }` a `OrdenTrabajo`.

2. **Vista de detalle (`features/ordenes-trabajo/detail/`):**
   - Agregar barra de progreso (PrimeNG `ProgressBar` o equivalente ya usado en el resto de la UI) con el texto `"Entregado: {recibido} de {cotizado}"`.
   - Actualizar el semáforo por ítem para reflejar `cantidad_recibida` vs `cantidad_cotizada` (no solo el campo `estado` textual).

3. **Vista de listado (`features/ordenes-trabajo/list/`):**
   - Agregar columna/indicador de porcentaje de avance, siguiendo el mismo patrón visual de "Semáforo" que ya se usó en Órdenes de Compra (ver `oc-logistica-frontend-ui-list` en `.harness/dag.json`).

---

## Criterios de Aceptación (Definición de Done)

- [ ] Columna `cantidad_cotizada` reemplaza a `cantidad` en `orden_trabajo_referencias`, sin pérdida de datos.
- [ ] Registrar una recepción de OC (desde OT o desde OC directamente) actualiza `orden_trabajo_referencias.cantidad_recibida` de las referencias correspondientes.
- [ ] El estado general de la OT pasa automáticamente a `En Proceso` en cuanto hay al menos una recepción parcial.
- [ ] `OrdenTrabajoResource` expone el bloque `progreso` calculado.
- [ ] La vista de detalle de OT muestra barra de progreso con datos reales.
- [ ] La vista de listado de OT muestra indicador de avance.
- [ ] `registrarDesdeOrdenCompra` sin OT asociada sigue funcionando sin errores (compatibilidad con flujo directo desde OC).
- [ ] Tests backend nuevos pasan; `php artisan test` sin fallos.
- [ ] `./vendor/bin/pint` sin errores de estilo; `ng lint` sin errores en frontend.

---

## Archivos afectados (estimación)

**Backend:**
- `database/migrations/xxxx_rename_cantidad_to_cantidad_cotizada_orden_trabajo_referencias.php` (nuevo)
- `app/Models/OrdenTrabajoReferencia.php` (modificar)
- `app/Services/CotizacionService.php` (modificar)
- `app/Services/RecepcionCompraService.php` (modificar)
- `app/Services/OrdenTrabajoLifecycleService.php` (nuevo)
- `app/Http/Resources/OrdenTrabajoResource.php` (modificar)
- `app/Http/Resources/OrdenTrabajoReferenciaResource.php` (modificar)
- `tests/Feature/Api/OrdenTrabajoRecepcionSyncTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-trabajo.model.ts` (modificar)
- `src/app/features/ordenes-trabajo/detail/detail.component.ts` (modificar)
- `src/app/features/ordenes-trabajo/list/list.component.ts` (modificar)
