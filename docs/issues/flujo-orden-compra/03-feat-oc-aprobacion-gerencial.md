# feat: Aprobación y Devolución Gerencial de Órdenes de Compra

**Tipo:** Feature  
**Prioridad:** Alta  
**Módulo:** Órdenes de Compra (Backend + Frontend)  
**Dependencias:** `01-feat-oc-maquina-estados-y-permisos.md`, `02-feat-oc-envio-revision-y-ajuste-stock.md`  
**Issue relacionado:** Epic [flujo-orden-compra](README.md)

---

## Contexto

El Paso 3 del flujo del cliente introduce el control de **Gerencia Comercial** previo al pago de la orden:
* **Precondición:** La OC se encuentra en estado `En Espera de Aprobación Gerencial` con stock confirmado y garantizado.
* **Actor:** Usuario con rol `Gerente Comercial` (o Administrador).
* **Decisión A (Aprobar):**
  - Clic en "Aprobar Orden".
  - Registra `aprobado_por_gerente_id` y `fecha_aprobacion_gerencia`.
  - Post-condición: La OC pasa a `Pendiente de Pago`.
* **Decisión B (Rechazar / Devolver a Asesor - Contingencia):**
  - Clic en "Devolver a Asesor".
  - Modal con campo obligatorio de *"Comentarios de rechazo"* (ej. "Error en negociación de precio", "Cambiar condiciones de flete").
  - Post-condición: La OC retrocede a estado `Devuelta por Gerencia`, notificando y quedando disponible en la bandeja del Asesor para su corrección.

---

## Propuesta Técnica

### Backend (Laravel 13)

1. **Autorización y Políticas:**
   - Crear ability `approveGerencia` y `rejectGerencia` en `OrdenCompraPolicy`.
   - Permitir solo a roles `['Gerente Comercial', 'Administrador', 'super_admin']`.

2. **Endpoints en `OrdenCompraController`:**
   - `POST /v1/ordenes-compra/{id}/aprobar-gerencia`:
     * Valida que la OC esté en `En Espera de Aprobación Gerencial`.
     * Guarda `aprobado_por_gerente_id = auth()->id()` y `fecha_aprobacion_gerencia = now()`.
     * Transiciona a `Pendiente de Pago`.
   - `POST /v1/ordenes-compra/{id}/devolver-gerencia`:
     * Valida que la OC esté en `En Espera de Aprobación Gerencial`.
     * Valida request: `motivo_rechazo` obligatorio (`required|string|min:10|max:1000`).
     * Guarda `motivo_rechazo_gerencia`.
     * Transiciona a `Devuelta por Gerencia`.

3. **Re-envío por parte del Asesor:**
   - Cuando la OC está en `Devuelta por Gerencia`, el Asesor puede ajustar condiciones y volver a enviar a aprobación gerencial (`POST /v1/ordenes-compra/{id}/reenviar-gerencia`).

### Frontend (Angular 21)

1. **Componente de Detalle (`detail.component.ts`):**
   - Si el usuario tiene rol `Gerente Comercial` o `Administrador` y la orden está en `En Espera de Aprobación Gerencial`:
     * Mostrar barra de acciones gerenciales:
       - Botón de éxito: "Aprobar Orden" (verde, icono check).
       - Botón de advertencia: "Devolver a Asesor" (naranja/rojo, icono reply/times).
   - Diálogo Modal para Devolución:
     * Header: "Devolver Orden de Compra al Asesor".
     * Textarea: "Comentarios de rechazo / instrucciones de corrección" (campo obligatorio con validación reactiva).
   - Card informativa de rechazo:
     * Si la orden está en `Devuelta por Gerencia`, mostrar un banner destacado con el motivo registrado por el gerente y la fecha.
   - Botón para el Asesor: "Reenviar a Gerencia" tras solventar observaciones.

2. **Filtro en Listado (`list.component.ts`):**
   - Quick-filter / Tab en la tabla para "Pendientes de Aprobación Gerencial".

---

## Criterios de Aceptación (Definición de Done)

- [ ] Solo usuarios con rol `Gerente Comercial` o `Administrador` pueden ver y ejecutar la aprobación o devolución gerencial.
- [ ] La aprobación transiciona la orden a `Pendiente de Pago` y registra el usuario y timestamp.
- [ ] La devolución exige un comentario de rechazo de al menos 10 caracteres; sin él, no se puede enviar.
- [ ] La orden retrocede a `Devuelta por Gerencia` y muestra el comentario al Asesor.
- [ ] El Asesor puede corregir y volver a someter la orden a aprobación gerencial.
- [ ] Feature tests en backend para ambos flujos y permisos de rol.
- [ ] `ng lint` y `npm test` limpios en frontend.

---

## Archivos Afectados (Estimación)

* `heavy-api/app/Policies/OrdenCompraPolicy.php`
* `heavy-api/app/Http/Controllers/Api/V1/OrdenCompraController.php`
* `heavy-api/app/Services/OrdenCompraLifecycleService.php`
* `heavy-front/src/app/core/services/orden-compra.service.ts`
* `heavy-front/src/app/features/ordenes-compra/detail/detail.component.ts`
* `heavy-front/src/app/features/ordenes-compra/list/list.component.ts`
