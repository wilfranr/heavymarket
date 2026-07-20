# feat: Implementar ciclo de vida completo de estados para Órdenes de Compra

**Tipo:** Feature
**Prioridad:** Alta
**Módulo:** Órdenes de Compra (Backend + Frontend)
**Dependencias:** Ninguna

---

## Contexto

El módulo de Órdenes de Compra actualmente implementa un modelo de estados rudimentario con solo 4 estados válidos (`Pendiente`, `En proceso`, `Entregado`, `Cancelado`) más un estado implícito (`Despachado`) que se setea directamente desde el Portal de Proveedores sin pasar por validación de FormRequests.

Este modelo es insuficiente para rastrear adecuadamente el ciclo de vida de una orden de compra desde su generación hasta su cierre formal. No existe concepto de revisión previa al envío, confirmación del proveedor, recepción parcial ni cierre con resolución de novedades.

## Problema Detectado

### Estados actuales (implementados)

| Estado | Definido en | Usado en |
|--------|-------------|----------|
| `Pendiente` | `StoreOrdenCompraRequest:45` | Default al crear OC (`CotizacionService:294`) |
| `En proceso` | `StoreOrdenCompraRequest:45` | Solo validación, sin uso real |
| `Entregado` | `StoreOrdenCompraRequest:45` | Solo validación, sin uso real |
| `Cancelado` | `StoreOrdenCompraRequest:45` | Solo validación, sin uso real |
| `Despachado` | No está en FormRequests | `ProviderPortalController:288` (set directo) |

### Inconsistencia técnica

El estado `Despachado` se asigna en `ProviderPortalController:288` pero no está incluido en el `Rule::in()` de `StoreOrdenCompraRequest` ni `UpdateOrdenCompraRequest`. Esto significa que actualizar una OC a `Despachado` vía el endpoint estándar `PUT /ordenes-compra/{id}` falla en validación. Solo funciona por bypass del portal de proveedores.

---

## Estados propuestos

| Estado | Descripción |Quién lo ejecuta |
|--------|-------------|-----------------|
| `Pendiente de envío` | Ya fue validada internamente y está lista para enviarse al proveedor | Asesor/Admin (acción manual) |
| `Enviada` | La OC fue enviada al proveedor | Asesor/Admin (acción manual o automática por email) |
| `Confirmada` | El proveedor confirmó que acepta la orden, precios, cantidades y condiciones | Proveedor (portal) o Asesor (registro manual) |
| `Recibida parcialmente` | Llegó solo una parte de los repuestos | Logística (registro de recepción) |
| `Recibida` | Se recibió todo lo solicitado en la OC | Logística (registro de recepción completa) |
| `Cerrada` | La compra terminó completamente: mercancía recibida, novedades resueltas y sin cantidades pendientes | Admin/Logística (cierre formal) |
| `Cancelada` | La orden ya no se ejecutará | Admin (en cualquier estado no terminal) |

### Mapa de transiciones

```
Pendiente de envío --> Enviada --> Confirmada --> Recibida --> Cerrada
       |              |            |              |
       |              |            |              +--> Recibida parcialmente --> Recibida --> Cerrada
       |              |            |                                        |
       |              |            +--> Recibida parcialmente               +--> Cerrada (con novedades)
       |              |
       +--------------+--> Cancelada
```

**Estados terminales:** `Cerrada`, `Cancelada`.

**Reglas de transición:**
- `Pendiente de envío` y `Enviada` pueden cancelarse con justificación.
- `Confirmada` solo puede cancelarse con aprobación de Admin (implicaciones comerciales con proveedor).
- `Recibida parcialmente` no puede cancelarse; debe resolverse como `Recibida` o `Cerrada` con novedades.
- `Recibida` transiciona a `Cerrada` automáticamente si no hay novedades pendientes.

---

## Requerimientos Técnicos

### Backend

1. **Crear Enum `OrdenCompraEstado`** en `app/Enums/OrdenCompraEstado.php` con:
   - 7 casos correspondientes a los estados propuestos.
   - Método `transicionesValidas(): array` que retorne el mapa de transiciones.
   - Método `puedeTransitarA(self $destino): bool`.
   - Método `esTerminal(): bool`.

2. **Crear migración** para:
   - Actualizar columna `estado` en `orden_compras` con los nuevos valores.
   - Agregar columna `cantidad_recibida` (integer, default 0) en `orden_compra_referencia`.
   - Agregar columna `fecha_envio` (nullable datetime) en `orden_compras`.
   - Agregar columna `fecha_confirmacion` (nullable datetime) en `orden_compras`.
   - Agregar columna `fecha_recepcion` (nullable datetime) en `orden_compras`.
   - Agregar columna `motivo_cancelacion` (nullable text) en `orden_compras`.
   - Agregar columna `notas_cierre` (nullable text) en `orden_compras`.

3. **Actualizar FormRequests:**
   - `StoreOrdenCompraRequest`: Reemplazar `Rule::in()` con valores del Enum.
   - `UpdateOrdenCompraRequest`: Reemplazar `Rule::in()` con valores del Enum.
   - Crear `TransitionOrdenCompraRequest` para endpoint dedicado de transiciones con validación de estado origen/destino.

4. **Crear endpoint de transición:**
   - `PATCH /api/v1/ordenes-compra/{orden_compra}/transition`
   - Recibe `estado_destino` y datos adicionales según transición (motivo, cantidades, etc.).
   - Valida transición permitida usando el Enum.
   - Registra timestamp correspondiente (`fecha_envio`, `fecha_confirmacion`, `fecha_recepcion`).

5. **Actualizar `CotizacionService`:**
   - Cambiar estado inicial de OC de `Pendiente` a `Pendiente de envío` en `crearOrdenCompra()`.

6. **Actualizar `ProviderPortalController`:**
   - Agregar endpoint para que proveedor confirme OC (`Confirmada`).
   - Actualizar `updateDispatch` para usar el Enum correctamente.

7. **Recepción desde Orden de Trabajo:**
   - El endpoint directo `POST /api/v1/ordenes-compra/{orden_compra}/receive` queda rechazado por arquitectura.
   - La recepción física se registra desde `POST /api/v1/ordenes-trabajo/{orden_trabajo}/recepciones-compra`.
   - Cada recepción crea cabecera y detalles auditables, con cantidad recibida, conforme y rechazada.
   - La OC se actualiza automáticamente a `Recibida parcialmente` o `Recibida` según acumulados conformes.

8. **Tests:**
   - Test unitario del Enum `OrdenCompraEstado` (transiciones válidas/inválidas).
   - Test feature del endpoint de transición (casos válidos e inválidos).
   - Test feature del endpoint de recepción (parcial y completa).
   - Actualizar tests existentes que usen estados antiguos.

### Frontend

1. **Actualizar modelo `OrdenCompra`** en `core/models/orden-compra.ts`:
   - Agregar nuevos campos (`fecha_envio`, `fecha_confirmacion`, `fecha_recepcion`, `motivo_cancelacion`, `notas_cierre`).
   - Actualizar tipo de `estado` con union type de los 7 estados.

2. **Actualizar servicio `OrdenCompraService`**:
   - Agregar método `transition(id, estadoDestino, data)`.
   - Agregar método `receive(id, referencias)`.

3. **Actualizar vista de detalle de OC:**
   - Mostrar estado actual con badge de color diferenciado.
   - Botones de acción contextual según estado actual (Enviar, Confirmar, Recibir, Cerrar, Cancelar).
   - Modal de confirmación para cancelaciones con motivo obligatorio.
   - Modal de recepción con cantidades por referencia.

4. **Actualizar vista de listado de OC:**
   - Filtros por los nuevos estados.
   - Semáforo visual actualizado con colores por estado.

5. **Actualizar Portal de Proveedores:**
   - Agregar acción de "Confirmar OC" para el proveedor.
   - Mostrar estados actualizados en listado de OCs del proveedor.

---

## Criterios de Aceptación (Definición de Done)

- [ ] Enum `OrdenCompraEstado` creado con 7 estados y mapa de transiciones.
- [ ] Migración ejecutada correctamente sin pérdida de datos existentes.
- [ ] Endpoint `PATCH /ordenes-compra/{id}/transition` funcional con validación de transiciones.
- [ ] Endpoint `POST /ordenes-compra/{id}/receive` funcional con cálculo de recepción parcial/completa.
- [ ] `CotizacionService` crea OCs en estado `Pendiente de envío` (no `Pendiente` ni `Borrador`).
- [ ] `ProviderPortalController` usa Enum correctamente (sin bypass de validación).
- [ ] Frontend muestra botones de acción contextual según estado.
- [ ] Frontend permite registrar recepción con cantidades por referencia.
- [ ] Portal de proveedores permite confirmar OC.
- [ ] Tests unitarios del Enum pasan (transiciones válidas e inválidas).
- [ ] Tests feature de endpoints de transición y recepción pasan.
- [ ] `php artisan test` sin fallos.
- [ ] `./vendor/bin/pint` sin errores de estilo.
- [ ] `ng lint` sin errores en frontend.

---

## Triage Técnico (Harness)

**Rol:** Triage Agent  
**Estado del triage:** `awaiting_review` en `.harness/dag.json`  
**Topic key:** `decision/orden-compra-estados`

### Diagnóstico

La causa técnica no es solo la ausencia de `Despachado` en los `FormRequest`.
El problema de fondo es que el módulo no tiene una fuente de verdad para estados
ni un servicio transaccional que gobierne cambios de ciclo de vida. Hoy `update`
puede modificar `estado` como un atributo común, mientras el Portal de
Proveedores lo muta por bypass desde `ProviderPortalController`.

### Decisiones de arquitectura

1. Crear `OrdenCompraEstado` como contrato central del backend.
2. Mover cambios de ciclo de vida a endpoints dedicados:
   - `PATCH /api/v1/ordenes-compra/{orden_compra}/transition`
   - `POST /api/v1/ordenes-compra/{orden_compra}/receive`
   - endpoint del portal para confirmación de proveedor.
3. Encapsular la lógica en un `OrdenCompraLifecycleService` para mantener los
   controladores delgados y evitar duplicar reglas entre API interna y portal.
4. Mantener `update` para datos editables de la OC, no para saltos operativos de
   estado.
5. El estado legacy `Despachado` no debe sobrevivir como estado formal; el
   despacho queda representado por `guia`, `transportadora_id`,
   `fecha_despacho` y observaciones, mientras el estado de negocio permanece en
   `Confirmada`, `Recibida parcialmente` o `Recibida` según recepción.

### Política preliminar de migración de datos

La decisión comercial de históricos debe validarse antes del despliegue
productivo. Como propuesta técnica inicial:

| Estado legacy | Estado nuevo propuesto |
|---------------|------------------------|
| `Pendiente` reciente | `Pendiente de envío` |
| `Pendiente` antigua | `Confirmada` o revisión manual |
| `En proceso` | `Confirmada` |
| `Despachado` | `Confirmada` |
| `Entregado` | `Recibida` |
| `Cancelado` | `Cancelada` |

El corte de "reciente" queda propuesto en 30 días, pero debe confirmarse con el
equipo comercial antes de ejecutar en producción.

### DAG propuesto

El grafo de implementación quedó registrado en `.harness/dag.json` con prefijo
`oc-estados-*` y dividido por atomicidad:

1. Contrato backend (`OrdenCompraEstado`).
2. Migración y modelos.
3. FormRequests y Resources.
4. Servicio de lifecycle + endpoints.
5. Integraciones con `CotizacionService` y Portal de Proveedores.
6. Tests backend.
7. Contrato, store y UI frontend.
8. Tests frontend.
9. Documentación.
10. Revisión final con gates backend/frontend.

---

## Notas de Implementación

### Migración de datos existentes

Las OCs existentes con estado `Pendiente` deben migrarse a `Pendiente de envío` si fueron creadas recientemente (últimos 30 días) o mantenerse como `En proceso` si son antiguas y ya fueron gestionadas. Las OCs existentes en `Borrador` también deben normalizarse a `Pendiente de envío` porque ese estado fue eliminado por decisión de negocio.

### Semáforo visual propuesto

| Estado | Color sugerido | Código |
|--------|---------------|--------|
| `Pendiente de envío` | Amarillo | `#FFFF00` |
| `Enviada` | Azul | `#2196F3` |
| `Confirmada` | Verde claro | `#8BC34A` |
| `Recibida parcialmente` | Naranja | `#FF9800` |
| `Recibida` | Verde | `#00ff00` |
| `Cerrada` | Verde oscuro | `#4CAF50` |
| `Cancelada` | Rojo | `#ff0000` |

### Impacto en otros módulos

- **Órdenes de Trabajo:** No se ven afectadas directamente, pero el estado de la OC podría influir en la semaforización de referencias en la OT (futuro).
- **Dashboard:** Las métricas de "órdenes" deben considerar los nuevos estados para conteos relevantes.
- **Notificaciones:** Considerar notificar al proveedor cuando la OC pasa a `Enviada` y al asesor cuando pasa a `Confirmada`.

### Archivos afectados (estimación)

**Backend:**
- `app/Enums/OrdenCompraEstado.php` (nuevo)
- `app/Http/Controllers/Api/V1/OrdenCompraController.php` (modificar)
- `app/Http/Requests/StoreOrdenCompraRequest.php` (modificar)
- `app/Http/Requests/UpdateOrdenCompraRequest.php` (modificar)
- `app/Http/Requests/TransitionOrdenCompraRequest.php` (nuevo)
- `app/Services/CotizacionService.php` (modificar)
- `app/Http/Controllers/Api/V1/ProviderPortalController.php` (modificar)
- `database/migrations/xxxx_add_ordenes_compra_estados.php` (nuevo)
- `tests/Feature/OrdenCompraTransitionTest.php` (nuevo)
- `tests/Unit/Enums/OrdenCompraEstadoTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-compra.ts` (modificar)
- `src/app/core/services/orden-compra.service.ts` (modificar)
- `src/app/features/ordenes-compra/detail/` (modificar)
- `src/app/features/ordenes-compra/list/` (modificar)
- `src/app/features/provider-portal/` (modificar)
