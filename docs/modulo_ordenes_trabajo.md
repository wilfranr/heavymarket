# Módulo Órdenes de Trabajo

## 1. Descripción General

El módulo de **Órdenes de Trabajo (OT)** gestiona el flujo logístico interno después de que un pedido/cotización entra en ejecución. Su propósito es:

- **Rastrear repuestos**: controlar, línea por línea, cuánto se cotizó, cuánto llegó de proveedor (vía recepción de compra) y cuánto se depuró como faltante definitivo.
- **Cierre técnico automático**: cuando `recibida + depurada == cotizada` en todas las líneas, la OT pasa sola a `Lista para Facturar`.
- **Cierre comercial**: Contabilidad factura (registra el número de factura emitido en el software contable externo) y la OT se cierra como `Cerrada`.
- **Logística y despacho**: transportadora, guía y dirección de despacho del envío al cliente.

HeavyMarket **no reemplaza** el software contable: solo registra el número de factura ya emitido externamente.

## 2. Modelo de Negocio

```
Cliente → Pedido → Cotización → [APROBADA] → Orden de Trabajo (Pendiente)
                                                    │
                        ┌───────────────────────────┴───────────────────────────┐
                        ↓                                                       ↓
          Órdenes de Compra a proveedores                         Depuración de faltantes
                        ↓                                                       │
          Recepción de Compra (parcial/total)                                  │
                        ↓                                                       │
          OrdenTrabajoLifecycleService sincroniza                              │
          cantidad_recibida por línea ──────────────────────────────────────────┘
                        ↓
          ¿recibida + depurada == cotizada en TODAS las líneas?
                        ↓ sí
              Lista para Facturar  →  Contabilidad factura  →  Cerrada
```

**Flujo real:**
1. Se crea la Orden de Trabajo (manual, o asociada a `pedido_id`/`cotizacion_id`). Estado inicial: `Pendiente`.
2. Se generan Órdenes de Compra a proveedores para las referencias de la OT.
3. Logística registra **recepciones de compra** (parciales o totales) contra esas órdenes de compra.
4. `OrdenTrabajoLifecycleService::sincronizarProgresoPorRecepcion()` actualiza `cantidad_recibida` en cada línea y recalcula el estado general (`Pendiente` → `En Proceso` cuando hay algo recibido).
5. Si un proveedor no puede reponer una pieza, el rol Asesor (Vendedor/Admin) **depura** esa línea como faltante definitivo (`OrdenTrabajoDepuracionService`), indicando cantidad y motivo.
6. Cada actualización de cantidades dispara el evento `OrdenTrabajoReferenciaActualizada`, cuyo listener `RecalcularCompletitudOrdenTrabajo` evalúa si `recibida + depurada == cotizada` en **todas** las líneas. Si se cumple, la OT pasa automáticamente a `Lista para Facturar`.
7. Contabilidad factura desde la bandeja `/app/ordenes-trabajo/facturacion`: registra `numero_factura` (y opcionalmente el PDF) y la OT pasa a `Cerrada`.
8. En paralelo, Logística gestiona el despacho al cliente (transportadora, guía, dirección), editable desde la vista de edición de la OT.

## 3. Estructura del Modelo

### Orden de Trabajo (Backend) — tabla `orden_trabajos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | bigint | Identificador único |
| `user_id` | bigint nullable | Usuario que creó la orden |
| `tercero_id` | bigint nullable | FK a terceros — cliente final |
| `pedido_id` | bigint nullable | FK a pedidos — pedido origen |
| `cotizacion_id` | bigint nullable | FK a cotizaciones — cotización origen |
| `estado` | varchar(255), default `Pendiente` | Ver enum en sección 3.1. Columna convertida de ENUM legacy a VARCHAR (migración `2026_09_05_150000_...`) para admitir los estados nuevos sin truncamiento silencioso de MySQL |
| `fecha_ingreso` | date nullable | Fecha de ingreso |
| `fecha_entrega` | date nullable | Fecha estimada/real de entrega |
| `direccion_id` | bigint nullable | FK a `direcciones` — dirección de despacho |
| `telefono` | string nullable | Teléfono de contacto |
| `observaciones` | text nullable | Notas internas |
| `guia` | string nullable | Número de guía de transporte |
| `transportadora_id` | bigint nullable | FK a `transportadoras` |
| `archivo` | string nullable | Campo libre para adjunto de guía/comprobante. **No está implementado en el frontend actual** (ningún formulario lo sube ni lo muestra) — ver sección 11 |
| `motivo_cancelacion` | string nullable | Obligatorio cuando `estado = Cancelado` |
| `numero_factura` | string nullable | Número de factura emitido externamente (agregado en `2026_09_05_143600_...`) |
| `factura_pdf` | string nullable | Ruta del PDF del comprobante de factura, si se adjuntó |
| `facturado_por` | bigint nullable | FK a `users` — quién facturó |
| `facturado_at` | timestamp nullable | Cuándo se facturó |
| `timestamps` | — | `created_at`, `updated_at` |

No existe campo `valor_total` en la tabla; el total facturable se calcula en tiempo real (ver sección 4.4).

### Tabla pivote `orden_trabajo_referencias`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | bigint | Identificador único |
| `orden_trabajo_id` | bigint | FK a `orden_trabajos` |
| `pedido_referencia_id` | bigint nullable | FK a `pedido_referencias` — de ahí se llega a la `Referencia` real (`hasOneThrough`) |
| `cantidad_cotizada` | int, default 1 | Cantidad original cotizada (columna renombrada desde `cantidad` en `2026_09_05_133100_...`) |
| `cantidad_recibida` | int, default 0 | Sincronizada automáticamente desde las recepciones de compra conformes |
| `cantidad_depurada` | int, default 0 | Cantidad marcada como faltante definitivo (agregada en `2026_09_05_135900_...`) |
| `motivo_depuracion` | text nullable | Motivo de la depuración más reciente |
| `depurado_por` | bigint nullable | FK a `users` |
| `depurado_at` | timestamp nullable | Cuándo se depuró |
| `estado` | string, default `Pendiente` | `Pendiente` \| `Recibido` \| `Cancelado` \| `Despachado` (valores validados en `UpdateOrdenTrabajoRequest`) |
| `recibido` | boolean, default false | `true` cuando `cantidad_recibida >= cantidad_cotizada` |
| `fecha_recepcion` | date nullable | — |
| `observaciones` | text nullable | — |
| `timestamps` | — | `created_at`, `updated_at` |

**Regla de depuración**: `cantidad_recibida + cantidad_depurada` nunca puede superar `cantidad_cotizada` (validado en `OrdenTrabajoDepuracionService::depurarFaltante`).

### 3.1 Estados de la Orden (enum de aplicación `App\Enums\OrdenTrabajoEstado`)

| Estado | ¿Quién lo asigna? | Descripción |
|--------|-------------------|--------------|
| `Pendiente` | Automático (creación / sin recepciones) | Orden creada, sin avance de recepción |
| `En Proceso` | Automático (`OrdenTrabajoLifecycleService`) | Al menos una línea tiene `cantidad_recibida > 0` |
| `Lista para Facturar` | **Solo automático** (`evaluarCompletitud`) | `recibida + depurada == cotizada` en todas las líneas. No asignable manualmente |
| `Completado` | Legacy | Se mantiene por compatibilidad con datos antiguos; el motor automático **nunca** lo asigna hoy |
| `Cerrada` | **Solo automático** (`OrdenTrabajoFacturacionService::facturar`) | Tras el cierre comercial (facturación). No asignable manualmente |
| `Cancelado` | Manual (Administrador) | Requiere `motivo_cancelacion` |

El endpoint genérico de actualización (`PUT /ordenes-trabajo/{id}`) solo permite asignar manualmente los estados de `OrdenTrabajoEstado::asignablesManualmente()` (excluye `Lista para Facturar` y `Cerrada`, que son destino exclusivo de los servicios automáticos).

### 3.2 Recepción de Compra (módulo relacionado)

Tabla `recepciones_compra` (FK `orden_trabajo_id` **nullable** — una recepción puede registrarse directamente contra una Orden de Compra sin pasar por una OT): `orden_compra_id`, `recibido_por`, `fecha_recepcion`, `numero_remision`, `observaciones`, `estado` (`Activa`/anulada), `anulada_por`, `fecha_anulacion`, `motivo_anulacion`.

Tabla `recepcion_compra_detalles`: por cada línea, `cantidad_recibida`, `cantidad_conforme`, `cantidad_rechazada`, `motivo_rechazo` (obligatorio si hay rechazo). Solo lo **conforme** alimenta `cantidad_recibida` en `orden_trabajo_referencias`.

## 4. Servicios de Dominio (Backend)

| Servicio | Responsabilidad |
|----------|------------------|
| `OrdenTrabajoLifecycleService` | Sincroniza `cantidad_recibida` desde las recepciones de compra conformes, recalcula el estado general (`Pendiente`/`En Proceso`) y evalúa el cierre técnico automático (`Lista para Facturar`). También calcula el progreso agregado (`cotizado`/`recibido`/`porcentaje`) que se muestra en listado y detalle |
| `OrdenTrabajoDepuracionService` | Marca una línea como faltante definitivo (`cantidad_depurada`), validando que no se exceda el saldo cotizado y que la OT no esté cerrada/cancelada |
| `OrdenTrabajoFacturacionService` | Cierre comercial: exige que la OT esté en `Lista para Facturar`, registra `numero_factura` + PDF opcional, pasa la OT a `Cerrada`. También calcula el **resumen facturable** (excluye del total lo depurado) |
| `RecepcionCompraService` | Registra recepciones de compra (parciales/totales), ya sea desde una OT (`registrarDesdeOrdenTrabajo`) o directamente desde una Orden de Compra |

**Evento y listener**: `OrdenTrabajoReferenciaActualizada` (se dispara tras commit, tanto en recepción como en depuración) → `RecalcularCompletitudOrdenTrabajo` → reevalúa si la OT debe pasar a `Lista para Facturar`. Es el único punto de entrada para ese recálculo.

## 5. Endpoints de la API

Base: `/v1/ordenes-trabajo` (resource estándar + rutas adicionales):

| Verbo | Ruta | Acción |
|-------|------|--------|
| GET | `/ordenes-trabajo` | Listar (filtros: `estado`, `tercero_id`, `pedido_id`, `transportadora_id`; orden: `sort_by`/`sort_order`; paginación) |
| POST | `/ordenes-trabajo` | Crear (`StoreOrdenTrabajoRequest`) |
| GET | `/ordenes-trabajo/{orden_trabajo}` | Detalle, con relaciones de pedido/cotización/transportadora/dirección/recepciones/referencias |
| PUT/PATCH | `/ordenes-trabajo/{orden_trabajo}` | Actualizar datos generales (reglas inline en el controlador, no usa `UpdateOrdenTrabajoRequest` como FormRequest — ver nota abajo) |
| DELETE | `/ordenes-trabajo/{orden_trabajo}` | Eliminar (borra primero sus referencias) |
| POST | `/ordenes-trabajo/{orden_trabajo}/recepciones-compra` | Registrar una recepción de compra asociada a esta OT (`StoreRecepcionCompraRequest`) |
| PATCH | `/ordenes-trabajo/{orden_trabajo}/referencias/{orden_trabajo_referencia}/depurar` | Depurar faltante de una línea (`DepurarOrdenTrabajoReferenciaRequest`) |
| GET | `/ordenes-trabajo/{orden_trabajo}/completitud` | Detalle de cumplimiento por línea (para explicar por qué sí/no está lista para facturar) |
| GET | `/ordenes-trabajo/{orden_trabajo}/resumen-facturacion` | Resumen de lo facturable (excluye lo depurado), solo rol `facturar` |
| POST | `/ordenes-trabajo/{orden_trabajo}/facturar` | Cierre comercial (`FacturarOrdenTrabajoRequest`) |
| GET | `/ordenes-trabajo/{orden_trabajo}/download-pdf` | Descarga el PDF de la orden |

> **Nota de implementación**: `OrdenTrabajoController::update()` no inyecta `UpdateOrdenTrabajoRequest` en la firma del método — valida con reglas definidas inline usando `Request::validate()`. El FormRequest `UpdateOrdenTrabajoRequest` existe en el código (con reglas equivalentes más el bloque `referencias.*`) pero no está wireado a esta ruta; **pendiente de confirmar** si es código muerto o si se usa en otro punto no localizado en esta revisión.

### Ejemplo — Crear Orden de Trabajo

```json
POST /v1/ordenes-trabajo
{
  "tercero_id": 23,
  "pedido_id": 10,
  "cotizacion_id": 5,
  "fecha_ingreso": "2026-10-08",
  "telefono": "3001234567",
  "transportadora_id": 2,
  "direccion_id": 7
}
```

### Ejemplo — Depurar línea

```json
PATCH /v1/ordenes-trabajo/8/referencias/41/depurar
{
  "cantidad_depurada": 1,
  "motivo_depuracion": "Proveedor no puede reponer la pieza dañada"
}
```

### Ejemplo — Facturar

```json
POST /v1/ordenes-trabajo/8/facturar
{
  "numero_factura": "FV-2026-00451"
}
```

## 6. Integración con Otros Módulos

- **Pedidos**: `pedido_id` permite trazabilidad desde el pedido origen; la tarjeta de detalle muestra máquina/fabricante asociados al pedido.
- **Cotizaciones**: `cotizacion_id` referencia la cotización aprobada que originó la OT.
- **Órdenes de Compra / Recepción de Compra**: la OT se vincula operativamente a órdenes de compra que comparten su `pedido_id` o `cotizacion_id` (`OrdenTrabajoLifecycleService::resolverDesdeOrdenCompra`); cada recepción conforme incrementa `cantidad_recibida`.
- **Transportadoras / Direcciones**: catálogos propios (`transportadora_id`, `direccion_id`), editables desde la vista de edición de la OT.
- **Terceros**: `tercero_id` es el cliente final; desde el detalle se puede abrir su ficha en modal de solo lectura.

## 7. Permisos y Roles (`OrdenTrabajoPolicy`)

| Rol | Permisos |
|-----|----------|
| `super_admin` | Acceso total |
| `Administrador` | CRUD completo, cancelar/recibir/despachar referencias, depurar, facturar |
| `Logistica` | Ver, listar; autorizado también para crear/actualizar la OT y registrar recepciones de compra (verificado vía `hasAnyRole` directo en el controlador/FormRequest, además de la Policy) |
| `Vendedor` | Solo lectura de la OT; **puede depurar referencias** (rol equivalente a "Asesor" del flujo de negocio) |
| `Contabilidad` | Solo lectura de la OT; **puede facturar** |

## 8. Frontend — Uso

### Rutas (`ordenes-trabajo.routes.ts`)

| Vista | URL | Componente |
|-------|-----|------------|
| Listado | `/app/ordenes-trabajo` | `ListComponent` |
| Crear | `/app/ordenes-trabajo/create` | `CreateComponent` |
| Facturación | `/app/ordenes-trabajo/facturacion` | `FacturacionComponent` — bandeja de Contabilidad con las OT en `Lista para Facturar` |
| Detalle | `/app/ordenes-trabajo/{id}` | `DetailComponent` |
| Editar | `/app/ordenes-trabajo/{id}/edit` | `EditComponent` |

### Listado
Tabla con columnas: ID, Origen (tag "Cotización" si aplica), Cliente, Pedido, Estado (tag de color), **Progreso** (barra + `recibido/cotizado`), Transportadora, Fecha Ingreso, Fecha Entrega, Guía, Acciones (ver/editar/eliminar). Filtros por estado, cliente y pedido.

### Detalle
- Tres tarjetas superiores de información (estilo "figma-card": `bg-surface-0/50/900`, `shadow-sm`, `h-[290px]`, acento `text-blue-500`) — Pedido, Máquina, Tercero — unificadas con el mismo estilo visual usado en el resto del módulo.
- Barra de progreso general (`recibido`/`cotizado`/`porcentaje`).
- Tabla de **Referencias** con columnas: Referencia, Descripción, Cant (cotizada), **Recibida**, **Depurada**, Marca, Entrega, Precio, Total, Acciones. Acción "Depurar" visible solo si el usuario puede depurar y la línea aún tiene saldo pendiente (`recibida + depurada < cotizada`).
- Diálogo de **Depurar faltante**: cantidad (acotada al saldo pendiente) + motivo obligatorio.
- Diálogo de **registrar recepción de compra** contra una orden de compra asociada, línea por línea (ya recibida, pendiente, recibida ahora, rechazada, motivo de rechazo).
- Sección "Detalles de Despacho y Logística".
- Acceso de solo lectura a la ficha del tercero (modal).

### Crear
Formulario de datos generales de la OT (fecha de ingreso, teléfono, tercero/pedido/cotización de origen, etc.). **Pendiente de revisión de diseño**: a diferencia de `edit`, esta vista aún no fue migrada al patrón visual Tailwind/figma-card ni tiene wireado el selector de transportadora (ver sección 11).

### Editar (rediseñada 2026-10-08)
Formulario con el patrón visual estándar (Tailwind + tokens PrimeNG, sin PrimeFlex): Estado, Teléfono, Fecha de Ingreso, Fecha de Entrega, **Transportadora** (select con filtro, cargado de `TransportadoraService`), Guía, **Dirección de despacho** (select filtrado por `tercero_id` de la OT, vía `DireccionService`), Observaciones, y Motivo de Cancelación (solo visible si `estado = Cancelado`). El campo `archivo` deliberadamente no se incluyó: no tiene mecanismo de carga real en ningún punto del frontend.

### Facturación
Bandeja de Contabilidad (`/app/ordenes-trabajo/facturacion`): tabla de OT en `Lista para Facturar` con acción "Facturar" que abre un diálogo mostrando el resumen facturable (línea por línea, cantidad facturable y subtotal, excluyendo lo depurado) y permite registrar el número de factura.

## 9. Casos de Uso Típicos

### Caso 1: Ciclo completo feliz
1. Se crea la OT en `Pendiente` con sus referencias cotizadas.
2. Se generan y envían órdenes de compra a proveedores.
3. Logística registra recepciones de compra conformes → la OT pasa a `En Proceso` y las líneas acumulan `cantidad_recibida`.
4. Cuando la última línea completa su cantidad, el evento recalcula completitud → la OT pasa sola a `Lista para Facturar`.
5. Contabilidad factura desde la bandeja → la OT pasa a `Cerrada`.

### Caso 2: Faltante de proveedor
1. Un proveedor informa que no puede reponer una pieza.
2. El Asesor (Vendedor/Admin) abre el diálogo "Depurar faltante" sobre esa línea, indica cantidad y motivo.
3. Si tras la depuración `recibida + depurada == cotizada` en todas las líneas, la OT también puede pasar a `Lista para Facturar` sin necesidad de recibir esa cantidad.

### Caso 3: Cancelación
1. Un Administrador cambia el estado de la OT a `Cancelado`, indicando `motivo_cancelacion` (obligatorio).
2. No se puede depurar ni facturar una OT cancelada.

## 10. Historial de Cambios

No existe tabla de auditoría dedicada (`orden_trabajo_historial`). La trazabilidad actual es indirecta: `depurado_por`/`depurado_at` en cada línea depurada, y `facturado_por`/`facturado_at` en la cabecera. Un historial completo de cambios de estado sigue sin implementarse.

## 11. Pendientes de Desarrollo / Conocidos

- [x] Policy de autorización (`OrdenTrabajoPolicy`)
- [x] Ciclo de vida automático (recepción → en proceso → lista para facturar) — `OrdenTrabajoLifecycleService`
- [x] Depuración de faltantes — `OrdenTrabajoDepuracionService`
- [x] Facturación / cierre comercial — `OrdenTrabajoFacturacionService`
- [x] Vista de edición rediseñada con transportadora/dirección (2026-10-08)
- [ ] Vista de creación (`create.component.ts`) sin migrar al patrón visual Tailwind actual; transportadora aún no verificada si está wireada ahí (revisar antes de tocarla)
- [ ] `UpdateOrdenTrabajoRequest` parece código muerto (la ruta `update` no lo usa) — confirmar y, si aplica, eliminarlo o conectarlo
- [ ] Campo `archivo` sin mecanismo real de carga en el frontend (ni create ni edit lo exponen)
- [ ] Tests de integración del flujo completo recepción→depuración→facturación
- [ ] Historial de cambios de estado (tabla de auditoría)
- [ ] Notificaciones cuando una línea cambia a "Recibido" o la OT pasa a "Lista para Facturar"

---

## 🛠️ Mapa de Implementación (Anclas Técnicas)

1. **El Contrato (Backend Models)**: `heavy-api/app/Models/OrdenTrabajo.php`, `OrdenTrabajoReferencia.php` — estados en `heavy-api/app/Enums/OrdenTrabajoEstado.php`.
2. **El Cerebro (API Controller)**: `heavy-api/app/Http/Controllers/Api/V1/OrdenTrabajoController.php`.
3. **Los Servicios de Dominio**: `heavy-api/app/Services/OrdenTrabajoLifecycleService.php`, `OrdenTrabajoDepuracionService.php`, `OrdenTrabajoFacturacionService.php`, `RecepcionCompraService.php`.
4. **Evento/Listener de recálculo**: `heavy-api/app/Events/OrdenTrabajoReferenciaActualizada.php` → `heavy-api/app/Listeners/RecalcularCompletitudOrdenTrabajo.php`.
5. **El Transporte (Frontend DTOs)**: `heavy-front/src/app/core/models/orden-trabajo.model.ts`.
6. **La Fachada (Frontend Service)**: `heavy-front/src/app/core/services/orden-trabajo.service.ts`.
7. **La Interacción (Feature UI)**: `heavy-front/src/app/features/ordenes-trabajo/{list,create,detail,edit,facturacion}/`.

---

*Documento creado: Mayo 2026*
*Última actualización: 2026-10-08 — reescritura completa a partir del código real (modelo de depuración/facturación, servicios de dominio, endpoints, vistas frontend reales)*
