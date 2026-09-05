# feat: Cierre técnico automático de la Orden de Trabajo (recibida + depurada == cotizada)

**Tipo:** Feature
**Prioridad:** Alta
**Módulo:** Órdenes de Trabajo (Backend + Frontend)
**Dependencias:** [01-feat-ot-sincronizacion-progreso](01-feat-ot-sincronizacion-progreso.md), [02-feat-ot-depuracion-faltantes](02-feat-ot-depuracion-faltantes.md)
**Issue relacionado:** Epic [flujo-ot-facturacion](README.md)

---

## Contexto

El cliente pide una fórmula de completitud explícita y automática:

> Si `(cantidad_recibida + cantidad_depurada) == cantidad_cotizada` para todas las líneas, el sistema detecta el 100% de cumplimiento y la OT pasa automáticamente a `Completada / Lista para Facturar`, apareciendo en la bandeja del usuario de Contabilidad.

Hoy no existe ningún cálculo de completitud para la OT. El único motor de "estado por acumulados" que existe en el sistema es el de **Orden de Compra** (`OrdenCompraLifecycleService`), y no tiene equivalente para OT. Este issue depende de que existan ambas columnas de origen (`cantidad_recibida` sincronizada por el issue 01, `cantidad_depurada` gestionada por el issue 02).

## Problema Detectado

1. El enum de estados de OT no es un `App\Enums\...`, es un `string` validado inline con `Rule::in(['Pendiente', 'En Proceso', 'Completado', 'Cancelado'])` en `OrdenTrabajoController::update()` (línea 194). No hay estado intermedio `Lista para Facturar`.
2. No hay ningún job/listener/servicio que evalúe la fórmula de completitud tras cada recepción o depuración.
3. No existe el concepto de "bandeja de Contabilidad" porque no existe el rol ni el módulo (eso se aborda en el issue 04, pero el estado que habilita esa bandeja debe nacer aquí).

## Propuesta

### Backend

1. **Crear `App\Enums\OrdenTrabajoEstado`** (siguiendo el mismo patrón que `OrdenCompraEstado`, ver `heavy-api/app/Enums/OrdenCompraEstado.php`), con los casos:
   - `Pendiente`
   - `EnProceso` (`"En Proceso"`)
   - `ListaParaFacturar` (`"Lista para Facturar"`) — nuevo
   - `Completado` (reservado para cuando ya fue facturada/cerrada — se resuelve en el issue 04; este issue solo introduce el caso en el enum para no tener que migrar dos veces)
   - `Cancelado`

   Incluir migración de datos: los registros existentes con `estado = 'Completado'` deben revisarse manualmente antes de aplicar el nuevo significado (dejar nota explícita, igual que se hizo en `feat-orden-compra-estados.md`, sección "Política preliminar de migración de datos").

2. **`OrdenTrabajoLifecycleService::evaluarCompletitud(OrdenTrabajo $ot)`** (extiende el servicio creado en el issue 01):
   - Recorre `orden_trabajo_referencias` de la OT.
   - Para cada línea valida `cantidad_recibida + cantidad_depurada == cantidad_cotizada`.
   - Si **todas** las líneas cumplen → transiciona la OT a `ListaParaFacturar`.
   - Si alguna línea no cumple → deja el estado que corresponda según el issue 01 (`Pendiente` / `En Proceso`).
   - Debe ser **idempotente**: llamarlo varias veces con el mismo estado de datos no debe generar eventos duplicados ni romper nada.

3. **Disparo del recálculo:** debe ejecutarse automáticamente al final de:
   - La sincronización de recepción (issue 01).
   - La depuración de un ítem (issue 02).

   Recomendado: usar un evento de dominio (`OrdenTrabajoReferenciaActualizada`) con un listener que invoque `evaluarCompletitud()`, en vez de llamarlo manualmente desde cada servicio — evita que un futuro punto de entrada (p. ej. ajuste manual de cantidades) se olvide de disparar el recálculo.

4. **Endpoint de solo lectura para verificar completitud** (útil para frontend y para debugging):
   ```
   GET /api/v1/ordenes-trabajo/{orden_trabajo}/completitud
   ```
   Respuesta:
   ```json
   {
     "completa": true,
     "lineas": [
       { "referencia_id": 101, "cotizada": 10, "recibida": 8, "depurada": 2, "cumple": true }
     ]
   }
   ```

5. **Tests:**
   - Todas las líneas cumplen → OT pasa a `Lista para Facturar`.
   - Una línea pendiente → OT permanece en `En Proceso`.
   - Combinación recibida parcial + depurada que sí completa la meta → transición correcta.
   - Doble ejecución del recálculo no duplica nada ni cambia el resultado (idempotencia).

### Frontend

1. **Modelo:** agregar `'Lista para Facturar'` al union type `OrdenTrabajoEstado` en `orden-trabajo.model.ts`.
2. **Vista de detalle/listado:** nuevo badge de estado para `Lista para Facturar` (color distintivo, p. ej. verde oscuro), y quitar la posibilidad de que un usuario cambie manualmente el estado a algo posterior a `Lista para Facturar` desde el formulario de edición estándar — ese salto queda reservado al flujo de facturación (issue 04).
3. **Panel de completitud (opcional pero recomendado):** en la vista de detalle, mostrar por línea si "cumple" o no, usando el endpoint `GET .../completitud`, para que el Asesor entienda por qué una OT no avanza.

---

## Criterios de Aceptación (Definición de Done)

- [ ] `App\Enums\OrdenTrabajoEstado` creado, con migración de datos documentada para los registros legacy en `Completado`.
- [ ] La OT transiciona automáticamente a `Lista para Facturar` cuando se cumple la fórmula en todas sus líneas.
- [ ] El recálculo se dispara automáticamente tras recepción (issue 01) y tras depuración (issue 02), sin intervención manual.
- [ ] Endpoint `GET .../completitud` disponible y correcto.
- [ ] El usuario no puede forzar manualmente el estado `Lista para Facturar` ni saltárselo vía `PUT /ordenes-trabajo/{id}` (ese campo se vuelve de solo transición automática).
- [ ] Tests cubren completitud parcial, completitud vía depuración y idempotencia del recálculo.
- [ ] `php artisan test` sin fallos; `./vendor/bin/pint` sin errores; `ng lint` sin errores.

---

## Archivos afectados (estimación)

**Backend:**
- `app/Enums/OrdenTrabajoEstado.php` (nuevo)
- `database/migrations/xxxx_add_lista_para_facturar_estado_orden_trabajos.php` (nuevo)
- `app/Services/OrdenTrabajoLifecycleService.php` (modificar — agrega `evaluarCompletitud`)
- `app/Events/OrdenTrabajoReferenciaActualizada.php` (nuevo)
- `app/Listeners/RecalcularCompletitudOrdenTrabajo.php` (nuevo)
- `app/Http/Controllers/Api/V1/OrdenTrabajoController.php` (modificar — nuevo método `completitud`)
- `routes/api.php` (agregar ruta)
- `tests/Feature/Api/OrdenTrabajoCierreTecnicoTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-trabajo.model.ts` (modificar)
- `src/app/features/ordenes-trabajo/detail/detail.component.ts` (modificar)
- `src/app/features/ordenes-trabajo/list/list.component.ts` (modificar)
