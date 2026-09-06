# feat: Bloqueo por Novedades en Recepción y Resolución de Conflictos

**Tipo:** Feature  
**Prioridad:** Alta  
**Módulo:** Órdenes de Compra / Logística (Backend + Frontend)  
**Dependencias:** `01-feat-oc-maquina-estados-y-permisos.md`, `05-feat-oc-despacho-fotos-y-alerta-transito.md`  
**Issue relacionado:** Epic [flujo-orden-compra](README.md)

---

## Contexto

Los Pasos 6 y 7 del flujo regulan el control de calidad física en la entrega y el manejo de incidencias:
* **Paso 6 (Recepción y Control de Novedades):**
  - **Actor:** `Logística`.
  - **Precondición:** La OC se encuentra en estado `En Tránsito`.
  - **Ruta Feliz:** Todo coincide. Clic en "Recibir y Aprobar". Pasa a `Entregada / Cerrada` y actualiza la Orden de Trabajo vinculada.
  - **Ruta de Novedad (Defectos o Faltantes):** Clic en "Reportar Novedad".
    * Modal que exige: Seleccionar ítems afectados, describir el problema (ej. "Carcasa golpeada", "Faltan 2 filtros") y **adjuntar obligatoriamente evidencia fotográfica del daño o empaque**.
    * Post-condición: La OC pasa al estado crítico `Recepción con Novedades (Bloqueada)`.
* **Paso 7 (Resolución de Conflictos):**
  - **Actores:** `Asesor` y `Contabilidad`.
  - **Precondición:** La OC está en `Recepción con Novedades (Bloqueada)`.
  - El Asesor negocia con el proveedor y registra la resolución en el sistema:
    * **Resolución 1 (Aprobar Reposición):** El proveedor enviará las piezas faltantes/buenas. La orden vuelve a `Pagada / Lista para Despacho` (con balance únicamente por los ítems pendientes a reponer).
    * **Resolución 2 (Solicitar Nota Crédito / Reembolso):** El proveedor reintegrará el dinero de las piezas dañadas/faltantes. Se notifica a Contabilidad para el cruce de cuentas, y la OC se cierra parcialmente actualizando la Orden de Trabajo solo con lo que sí fue conforme.

---

## Propuesta Técnica

### Backend (Laravel 13)

1. **Recepción y Novedad Obligatoria con Fotos:**
   - En `RecepcionCompraService::crearRecepcionConDetalles()`:
     * Si la suma de `cantidad_rechazada > 0` o hay ítems con novedades, exigir al menos una imagen asociada (`fotos`). Si no hay fotos adjuntas en el payload, abortar con error 422: *"Es obligatorio adjuntar evidencia fotográfica para reportar novedades en la recepción"*.
     * Transicionar la OC a `Recepción con Novedades (Bloqueada)`.
     * Si todo es conforme y `cantidad_conforme == cantidad_pedida`: Transicionar la OC a `Entregada / Cerrada`.

2. **Endpoints de Resolución de Novedades (`OrdenCompraController`):**
   - `POST /v1/ordenes-compra/{id}/resolver-novedad`:
     * Autorización: Solo rol `Vendedor` (Asesor), `Administrador` o `super_admin`.
     * Request:
       - `tipo_resolucion`: `'reposicion'` o `'nota_credito'`.
       - `comentario_resolucion`: `required|string|min:15|max:1000`.
       - `detalles_resolucion`: array de ítems afectados.
     * **Si `tipo_resolucion === 'reposicion'`:**
       - Genera un ciclo de re-despacho para las referencias pendientes.
       - La OC cambia de estado a `Pagada / Lista para Despacho` y queda habilitada nuevamente en el Portal del Proveedor para ingresar una nueva guía y despacho por las piezas de reposición.
     * **Si `tipo_resolucion === 'nota_credito'`:**
       - Notifica formalmente al rol `Contabilidad`.
       - Ajusta las cantidades efectivas de la OC cerrándola como `Entregada / Cerrada` (con saldo cancelado por nota crédito).
       - Actualiza la Orden de Trabajo logística para sincronizar solo con las cantidades aprobadas.

### Frontend (Angular 21)

1. **Modal de Recepción (`recepcion-compra-modal.component.ts`):**
   - Si se ingresa alguna `cantidad_rechazada > 0`, el componente `app-image-upload` se vuelve campo obligatorio (resaltado en rojo con advertencia).
   - El botón "Guardar recepción" no se habilita hasta que se seleccione la imagen de evidencia.

2. **Panel de Resolución de Novedades en Detalle OC (`detail.component.ts`):**
   - Cuando la OC está en `Recepción con Novedades (Bloqueada)`:
     * Mostrar alerta roja prominente: *"Orden Bloqueada por Novedad en Recepción"*.
     * Mostrar galería de fotos de la evidencia y motivos reportados por Logística.
     * Si el usuario es Asesor o Administrador, habilitar tarjeta de acción "Resolución de Novedad":
       - Radio buttons o cards para seleccionar:
         1. **Aprobar Reposición del Proveedor** (Reactiva despacho).
         2. **Solicitar Nota Crédito / Reembolso** (Cierre con saldo conforme y notificación a Contabilidad).
       - Textarea obligatorio de justificación de acuerdo con el proveedor.

---

## Criterios de Aceptación (Definición de Done)

- [ ] Logística no puede registrar rechazos o faltantes sin adjuntar evidencia fotográfica obligatoria.
- [ ] La presencia de rechazos o anomalías bloquea la orden en `Recepción con Novedades (Bloqueada)`.
- [ ] La recepción 100% conforme transiciona automáticamente a `Entregada / Cerrada`.
- [ ] El Asesor puede seleccionar "Aprobar Reposición", regresando la orden a `Pagada / Lista para Despacho` por el saldo pendiente.
- [ ] El Asesor puede seleccionar "Solicitar Nota Crédito", notificando a Contabilidad y cerrando la orden y OT con lo recibido efectivamente.
- [ ] Tests de Feature para ambos tipos de resolución en `heavy-api`.
- [ ] `./vendor/bin/pint` y `ng lint` limpios.

---

## Archivos Afectados (Estimación)

* `heavy-api/app/Services/RecepcionCompraService.php`
* `heavy-api/app/Services/OrdenCompraLifecycleService.php`
* `heavy-api/app/Http/Controllers/Api/V1/OrdenCompraController.php`
* `heavy-front/src/app/features/ordenes-compra/detail/recepcion-compra-modal/recepcion-compra-modal.component.ts`
* `heavy-front/src/app/features/ordenes-compra/detail/detail.component.ts`
