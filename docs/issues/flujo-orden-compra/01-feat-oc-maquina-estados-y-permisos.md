# feat: Rediseño de la Máquina de Estados, Roles y Permisos de Órdenes de Compra

**Tipo:** Refactor / Feature  
**Prioridad:** Alta (Bloqueante para el resto del flujo)  
**Módulo:** Órdenes de Compra (Backend + Frontend Core)  
**Dependencias:** Ninguna  
**Issue relacionado:** Epic [flujo-orden-compra](README.md)

---

## Contexto

El flujo operativo formal entregado por el cliente define estados y actores específicos que hoy no existen o se encuentran desacoplados en el sistema. Actualmente, la OC transiciona de forma lineal: `Generada` -> `Enviada` -> `Confirmada` -> `Pagada` -> `Despachada` -> `Recibida parcialmente / Recibida` -> `Cancelada`.

El cliente exige la incorporación de:
1. **Actores clave:** `Asesor` (generación, negociación de stock y novedades), `Proveedor` (ajuste y despacho), `Gerente Comercial` (aprobación/devolución), `Contabilidad` (pago y reembolso) y `Logística` (recepción y novedades).
2. **Nuevos estados del ciclo de vida:**
   - `Pendiente de Revisión de Stock` (reemplaza o formaliza el estado de envío inicial).
   - `Stock Incompleto` (alerta de faltantes del proveedor).
   - `En Espera de Aprobación Gerencial` (tras confirmación de inventario).
   - `Devuelta por Gerencia` (contingencia de rechazo gerencial).
   - `Pendiente de Pago` (aprobada por gerencia, previa al desembolso).
   - `Pagada / Lista para Despacho` (con comprobante).
   - `Cancelada - Reembolso Pendiente` (contingencia post-pago).
   - `En Tránsito` (reemplaza `Despachada`).
   - `Recepción con Novedades (Bloqueada)` (bloqueo por daño/faltante físico).
   - `Entregada / Cerrada` (cierre operativo).

---

## Propuesta Técnica

### Backend (Laravel 13)

1. **Migración de Estados y Campos:**
   - Asegurar que la columna `estado` en `orden_compras` sea `VARCHAR(100)` para soportar la nomenclatura exacta requerida sin truncamiento.
   - Agregar columnas de auditoría y soporte de contingencias:
     * `instrucciones_despacho` (`TEXT`, nullable).
     * `motivo_rechazo_gerencia` (`TEXT`, nullable).
     * `fecha_aprobacion_gerencia` (`TIMESTAMP`, nullable).
     * `aprobado_por_gerente_id` (`BIGINT UNSIGNED`, nullable, FK `users.id`).
     * `comprobante_pago_ruta` (`VARCHAR(255)`, nullable).
     * `fecha_pago` (`TIMESTAMP`, nullable).
     * `pagado_por_id` (`BIGINT UNSIGNED`, nullable, FK `users.id`).
     * `motivo_reembolso` (`TEXT`, nullable).

2. **Enum `App\Enums\OrdenCompraEstado`:**
   - Actualizar los casos del Enum:
     * `PendienteRevisionStock = 'Pendiente de Revisión de Stock'`
     * `StockIncompleto = 'Stock Incompleto'`
     * `EnEsperaAprobacionGerencial = 'En Espera de Aprobación Gerencial'`
     * `DevueltaPorGerencia = 'Devuelta por Gerencia'`
     * `PendienteDePago = 'Pendiente de Pago'`
     * `PagadaListaDespacho = 'Pagada / Lista para Despacho'`
     * `CanceladaReembolsoPendiente = 'Cancelada - Reembolso Pendiente'`
     * `EnTransito = 'En Tránsito'`
     * `RecepcionConNovedades = 'Recepción con Novedades (Bloqueada)'`
     * `EntregadaCerrada = 'Entregada / Cerrada'`
     * `Cancelada = 'Cancelada'`
   - Configurar la matriz de transiciones válidas en `transicionesValidas()`.
   - Definir métodos auxiliares (`esBloqueada()`, `esTerminal()`, etc.) y colores semánticos para badges.

3. **Roles y Políticas (`OrdenCompraPolicy` & Spatie Roles):**
   - Asegurar la existencia de los roles: `Gerente Comercial`, `Contabilidad`, `Logistica`, `Vendedor` (mapeado a Asesor) y `Proveedor`.
   - Restringir las transiciones según el rol en `OrdenCompraPolicy` o `OrdenCompraLifecycleService`:
     * Aprobar / Devolver Gerencia: Solo `Gerente Comercial`, `Administrador`, `super_admin`.
     * Registrar Pago: Solo `Contabilidad`, `Administrador`, `super_admin`.
     * Cancelar Pagada (Reembolso): Solo `Contabilidad`, `Administrador`, `super_admin`.
     * Registrar Novedad / Bloquear: Solo `Logistica`, `Administrador`, `super_admin`.

4. **Refactor de `OrdenCompraLifecycleService`:**
   - Validar precondiciones de rol, datos obligatorios y transiciones permitidas.

### Frontend (Angular 21)

1. **Modelo `orden-compra.model.ts`:**
   - Actualizar `type OrdenCompraEstado` con la nueva unión de literales.
   - Agregar a la interfaz `OrdenCompra` las propiedades `instrucciones_despacho`, `motivo_rechazo_gerencia`, `comprobante_pago_ruta`, etc.
2. **Utilidades y Tags:**
   - Actualizar utilidades de severidad (`getEstadoSeverity`) para los nuevos estados en badges y listas.

---

## Criterios de Aceptación (Definición de Done)

- [ ] Migración ejecutada sin errores de base de datos ni conflictos de clave foránea.
- [ ] Enum `OrdenCompraEstado` en backend refleja fielmente los estados del cliente y valida las transiciones.
- [ ] `OrdenCompraPolicy` previene que usuarios sin el rol adecuado disparen acciones críticas (p. ej. solo Contabilidad puede registrar pago).
- [ ] `OrdenCompra` en frontend tipado al 100% sin `any`.
- [ ] Tests unitarios y de feature para la máquina de estados en `OrdenCompraLifecycleServiceTest`.
- [ ] `./vendor/bin/pint` y `phpstan` pasan sin errores.
- [ ] `ng lint` y `ng build` en frontend pasan sin fallos.

---

## Archivos Afectados (Estimación)

* `heavy-api/database/migrations/xxxx_xx_xx_update_orden_compras_estados_and_columns.php`
* `heavy-api/app/Enums/OrdenCompraEstado.php`
* `heavy-api/app/Models/OrdenCompra.php`
* `heavy-api/app/Policies/OrdenCompraPolicy.php`
* `heavy-api/app/Services/OrdenCompraLifecycleService.php`
* `heavy-api/app/Http/Requests/TransitionOrdenCompraRequest.php`
* `heavy-front/src/app/core/models/orden-compra.model.ts`
* `heavy-front/src/app/features/ordenes-compra/detail/detail.component.ts`
