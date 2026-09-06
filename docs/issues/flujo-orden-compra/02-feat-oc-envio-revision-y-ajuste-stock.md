# feat: Envío a Revisión con Instrucciones de Despacho y Confirmación de Stock con Faltantes

**Tipo:** Feature  
**Prioridad:** Alta  
**Módulo:** Órdenes de Compra / Portal de Proveedores (Backend + Frontend)  
**Dependencias:** `01-feat-oc-maquina-estados-y-permisos.md`  
**Issue relacionado:** Epic [flujo-orden-compra](README.md)

---

## Contexto

El cliente especifica las siguientes interacciones para las Fases 1 y 2:
1. **Paso 1 (Envío):** El Asesor hace clic en "Enviar a Proveedor para Revisión". Debe desplegarse un **Modal obligatorio** para ingresar *"Instrucciones de despacho"*. Al enviar, pasa a `Pendiente de Revisión de Stock`.
2. **Paso 2 (Confirmación de Stock / Faltantes):**
   - El Proveedor ingresa al portal.
   - **Ruta Feliz:** Confirma stock completo -> pasa a `En Espera de Aprobación Gerencial`.
   - **Ruta con Faltantes:** El Proveedor edita las cantidades a lo que realmente tiene en stock físico y guarda. La OC pasa al estado `Stock Incompleto`.
   - **Acción del Asesor:** Recibe la alerta de "Stock Incompleto" y decide:
     * *Opción A:* Aprobar cantidades disponibles -> la orden ajusta su total y pasa a `En Espera de Aprobación Gerencial`.
     * *Opción B:* Cancelar orden -> la orden pasa a `Cancelada` con motivo.

---

## Propuesta Técnica

### Backend (Laravel 13)

1. **Campos en `orden_compra_referencia`:**
   - Para no perder la cantidad originalmente cotizada/pedida al proveedor cuando este ajuste por faltantes, agregar columna:
     * `cantidad_original` (entero, conserva el valor pedido).
     * `cantidad` pasa a ser la cantidad confirmada/disponible.
     * `motivo_faltante` (texto opcional del proveedor indicando por qué no tiene stock completo).

2. **Endpoints en `ProviderPortalController`:**
   - Modificar `POST /v1/provider-portal/ordenes-compra/{id}/confirm`:
     * Recibir array opcional de `items: [{ referencia_id, cantidad_disponible, motivo_faltante }]`.
     * Si todas las `cantidad_disponible == cantidad_original`: Transiciona directamente a `En Espera de Aprobación Gerencial`.
     * Si alguna `cantidad_disponible < cantidad_original`: Actualiza cantidades, registra faltantes y transiciona la OC a `Stock Incompleto`.

3. **Endpoints para Asesor en `OrdenCompraController`:**
   - `POST /v1/ordenes-compra/{id}/enviar-revision`:
     * Valida `instrucciones_despacho` (`required|string|max:1000`).
     * Actualiza el registro y transiciona a `Pendiente de Revisión de Stock`.
   - `POST /v1/ordenes-compra/{id}/resolver-faltantes`:
     * Recibe decisión: `'aprobar'` o `'cancelar'`.
     * Si `'aprobar'`: Recalcula `valor_total` de la OC con base en las cantidades disponibles confirmadas y transiciona a `En Espera de Aprobación Gerencial`.
     * Si `'cancelar'`: Exige `motivo_cancelacion` y transiciona a `Cancelada`.

### Frontend (Angular 21)

1. **Vista Detalle OC (`features/ordenes-compra/detail/`):**
   - Diálogo / Modal para la acción "Enviar a Proveedor para Revisión" con textarea obligatorio para "Instrucciones de despacho".
   - Alerta visual en cabecera si el estado es `Stock Incompleto` con banner de advertencia: *"El proveedor reportó faltantes de inventario"*.
   - Botones de decisión para el Asesor: "Aceptar Cantidades Disponibles" y "Cancelar Orden".

2. **Portal de Proveedores (`features/provider-portal/ordenes-compra/`):**
   - En el diálogo o vista de confirmación de la orden, permitir al proveedor editar la columna "Cantidad Disponible" para cada referencia.
   - Si detecta cantidades inferiores a lo solicitado, mostrar un aviso: *"Ha modificado cantidades. La orden pasará a revisión del asesor con faltantes."*

---

## Criterios de Aceptación (Definición de Done)

- [ ] Al hacer clic en "Enviar a Proveedor", se abre modal y es imposible enviar sin diligenciar "Instrucciones de despacho".
- [ ] La OC pasa a `Pendiente de Revisión de Stock` y almacena las instrucciones ingresadas.
- [ ] El Proveedor puede confirmar el stock completo en 1 clic (Ruta Feliz -> `En Espera de Aprobación Gerencial`).
- [ ] El Proveedor puede reducir cantidades si no tiene stock completo y guardar.
- [ ] La OC cambia a `Stock Incompleto` si el proveedor ajustó cantidades.
- [ ] El Asesor puede aprobar las nuevas cantidades (recalculando subtotal/total de la OC) o cancelar la orden.
- [ ] Tests de Feature para ambas rutas en `heavy-api`.
- [ ] `ng lint` y `./vendor/bin/pint` sin advertencias.

---

## Archivos Afectados (Estimación)

* `heavy-api/database/migrations/xxxx_xx_xx_add_faltantes_to_orden_compra_referencia.php`
* `heavy-api/app/Models/OrdenCompraReferencia.php`
* `heavy-api/app/Http/Controllers/Api/V1/ProviderPortalController.php`
* `heavy-api/app/Http/Controllers/Api/V1/OrdenCompraController.php`
* `heavy-front/src/app/features/ordenes-compra/detail/detail.component.ts`
* `heavy-front/src/app/features/provider-portal/ordenes-compra/ordenes-compra-list.component.ts`
