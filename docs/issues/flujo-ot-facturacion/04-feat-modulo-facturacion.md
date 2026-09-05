# feat: Módulo de Facturación y cierre comercial de la Orden de Trabajo

**Tipo:** Feature
**Prioridad:** Alta
**Módulo:** Facturación (nuevo) + Órdenes de Trabajo (Backend + Frontend)
**Dependencias:** [03-feat-ot-cierre-tecnico-automatico](03-feat-ot-cierre-tecnico-automatico.md)
**Issue relacionado:** Epic [flujo-ot-facturacion](README.md)

---

## Contexto

El último paso del flujo del cliente es: cuando la OT llega a `Lista para Facturar`, aparece en la bandeja de **Contabilidad**. Esa persona revisa un resumen exacto de lo que se debe facturar (excluyendo automáticamente los ítems depurados), emite la factura en su software contable externo, y solo registra en HeavyMarket el número de factura (obligatorio) y opcionalmente el PDF. Al hacerlo, la OT pasa a su estado final `Cerrada / Facturada`.

**Este módulo no existe en absoluto hoy.** Se verificó con búsqueda completa (`grep -rli "factura" heavy-api/app`) y los únicos resultados son de "dirección de facturación" del modelo `Tercero` — no hay modelo `Factura`, ni controlador, ni tabla, ni rol `Contabilidad`.

## Alcance explícito

Igual que aclara el cliente, **HeavyMarket no reemplaza el software contable** — no se factura desde aquí. Este módulo solo:
1. Muestra el resumen de lo facturable.
2. Registra el número de factura y, opcionalmente, adjunta el PDF ya emitido externamente.
3. Cierra formalmente la OT.

No incluye: cálculo de impuestos, generación de CUFE/DIAN, ni integración con un ERP contable. Si eso se necesita a futuro, es un issue aparte.

## Propuesta

### Backend

1. **Rol nuevo `Contabilidad`:** agregar al seeder de roles (`DevBootstrapSeeder.php` y el seeder de producción equivalente si existe) junto a los roles actuales (`super_admin, Administrador, Vendedor, Analista, Logistica, Cliente, Proveedor, panel_user`).

2. **Migración — extender `orden_trabajos`:**
   - `numero_factura` (nullable string)
   - `factura_pdf` (nullable string — ruta de storage, mismo patrón que `archivo` ya usado en el modelo para comprobantes)
   - `facturado_por` (nullable FK a `users`)
   - `facturado_at` (nullable timestamp)

3. **Extender `App\Enums\OrdenTrabajoEstado`** (creado en el issue 03) agregando el caso final:
   - `Cerrada` (`"Cerrada / Facturada"`)

   Y actualizar el significado de `Completado` heredado de datos legacy según lo que se haya decidido en el issue 03 (evitar tener dos estados terminales ambiguos — `Completado` legacy vs. `Cerrada` nuevo debe resolverse con una sola fuente de verdad).

4. **`OrdenTrabajoFacturacionService`** (nuevo) con método `facturar(OrdenTrabajo $ot, array $data, User $usuario)`:
   - Valida que la OT esté en estado `Lista para Facturar` (usar `OrdenTrabajoEstado::puedeTransitarA()` si el enum del issue 03 ya trae ese método, o agregarlo aquí si no).
   - Valida `numero_factura` requerido y único por OT (no permitir doble facturación de la misma orden).
   - Si viene `factura_pdf`, lo almacena igual que se hace con imágenes de recepción (`storage/app/public/facturas/{orden_trabajo_id}/`, ver patrón en `RecepcionCompraService::storeImagen()`).
   - Transiciona la OT a `Cerrada`, registra `facturado_por` y `facturado_at`.
   - Todo dentro de una transacción DB.

5. **Endpoint:**
   ```
   POST /api/v1/ordenes-trabajo/{orden_trabajo}/facturar
   ```
   Body (`multipart/form-data` para soportar el PDF opcional):
   ```json
   {
     "numero_factura": "FE-00123",
     "factura_pdf": "<archivo opcional>"
   }
   ```

6. **Endpoint de resumen facturable** (lo que Contabilidad revisa antes de emitir la factura externa):
   ```
   GET /api/v1/ordenes-trabajo/{orden_trabajo}/resumen-facturacion
   ```
   Debe excluir automáticamente las líneas con `cantidad_depurada > 0` del total a cobrar, y devolver cantidades netas por línea (`cantidad_recibida`, ya que `cantidad_depurada` no se cobra) junto con precios heredados de la cotización origen.

7. **Bandeja de Contabilidad:** extender el filtro existente en `OrdenTrabajoController::index()` (línea 41-55) para que `estado=Lista para Facturar` funcione como ya funciona para los demás estados (ya está soportado genéricamente vía `$request->input('estado')`, solo falta que el nuevo valor del enum sea válido ahí). Confirmar permisos: el rol `Contabilidad` debe tener `viewAny`/`view` sobre OT vía `OrdenTrabajoPolicy`, pero **no** debe poder crear/eliminar OTs ni editar referencias — solo facturar.

8. **Tests:**
   - Facturar una OT que no está `Lista para Facturar` → rechazado.
   - Facturar sin `numero_factura` → 422.
   - Facturar dos veces la misma OT → rechazado (no se puede reabrir).
   - Rol distinto a `Contabilidad`/`Administrador`/`super_admin` intentando facturar → 403.
   - `GET resumen-facturacion` excluye correctamente líneas depuradas del total.

### Frontend

1. **Modelo (`orden-trabajo.model.ts`):** agregar `numero_factura`, `factura_pdf`, `facturado_por`, `facturado_at`, y `'Cerrada'` al union type de estado.

2. **Servicio (`orden-trabajo.service.ts`):** agregar `getResumenFacturacion(id)` y `facturar(id, formData)`.

3. **Nueva vista/feature** `features/ordenes-trabajo/facturacion/` (o sección dentro del detalle existente, a criterio de UI, siguiendo la skill `ui_ux_design_expert` para consistencia de tema claro/oscuro):
   - Bandeja filtrada por `estado=Lista para Facturar`, visible en el menú solo para roles `Contabilidad`, `Administrador`, `super_admin` (agregar entrada en `app.menu.ts` siguiendo el patrón usado para habilitar Órdenes de Compra al rol Logística).
   - Vista de resumen facturable (usa `GET .../resumen-facturacion`).
   - Modal con campo obligatorio "Número de Factura" y adjunto opcional de PDF, acción "Facturar Orden".

4. **Badge de estado `Cerrada / Facturada`** en listado y detalle.

---

## Criterios de Aceptación (Definición de Done)

- [ ] Rol `Contabilidad` creado y con permisos correctos en `OrdenTrabajoPolicy` (solo ver + facturar, no editar/crear/eliminar).
- [ ] Endpoint `POST .../facturar` funcional: exige `numero_factura`, adjunta PDF opcional, transiciona a `Cerrada`.
- [ ] Endpoint `GET .../resumen-facturacion` excluye correctamente ítems depurados del total facturable.
- [ ] No se puede facturar una OT que no esté `Lista para Facturar`, ni facturarla dos veces.
- [ ] Frontend: bandeja de Contabilidad visible solo para roles autorizados, con resumen y modal de facturación.
- [ ] Tests backend cubren los casos de rechazo y el caso exitoso.
- [ ] `php artisan test` sin fallos; `./vendor/bin/pint` sin errores; `ng lint` sin errores.

---

## Archivos afectados (estimación)

**Backend:**
- `database/seeders/DevBootstrapSeeder.php` (modificar — agregar rol `Contabilidad`)
- `database/migrations/xxxx_add_facturacion_columns_orden_trabajos.php` (nuevo)
- `app/Enums/OrdenTrabajoEstado.php` (modificar — agregar caso `Cerrada`)
- `app/Services/OrdenTrabajoFacturacionService.php` (nuevo)
- `app/Http/Requests/FacturarOrdenTrabajoRequest.php` (nuevo)
- `app/Http/Controllers/Api/V1/OrdenTrabajoController.php` (modificar — métodos `facturar` y `resumenFacturacion`)
- `app/Policies/OrdenTrabajoPolicy.php` (modificar)
- `routes/api.php` (agregar rutas)
- `tests/Feature/Api/OrdenTrabajoFacturacionTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-trabajo.model.ts` (modificar)
- `src/app/core/services/orden-trabajo.service.ts` (modificar)
- `src/app/features/ordenes-trabajo/facturacion/` (nuevo)
- `src/app/layout/component/app.menu.ts` (modificar)
