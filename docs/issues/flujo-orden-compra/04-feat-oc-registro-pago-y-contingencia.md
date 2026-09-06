# feat: Registro de Pago por Contabilidad y Contingencia Post-Pago (Reembolso)

**Tipo:** Feature  
**Prioridad:** Alta  
**Módulo:** Órdenes de Compra (Backend + Frontend)  
**Dependencias:** `01-feat-oc-maquina-estados-y-permisos.md`, `03-feat-oc-aprobacion-gerencial.md`  
**Issue relacionado:** Epic [flujo-orden-compra](README.md)

---

## Contexto

El Paso 4 del flujo establece el control financiero de las compras:
* **Actor:** `Contabilidad` (y Administradores).
* **Precondición:** La OC está en estado `Pendiente de Pago`.
* **Acción Principal:** Contabilidad ejecuta el pago y hace clic en "Registrar Pago". Debe adjuntar obligatoriamente el comprobante de pago (archivo PDF o imagen).
* **Post-condición:** La OC pasa a `Pagada / Lista para Despacho`.
* **Contingencia Post-Pago (Siniestro o Pérdida de Inventario del Proveedor):**
  - Puede ocurrir que tras haber pagado, el proveedor informe siniestro o incapacidad de despacho.
  - Se debe habilitar un botón de emergencia: *"Cancelar Orden Pagada"*.
  - Esto cambia el estado a `Cancelada - Reembolso Pendiente`, notificando al equipo contable para la recuperación del dinero y ocultando o deteniendo la vista del Proveedor en su portal para evitar despachos indebidos.

---

## Propuesta Técnica

### Backend (Laravel 13)

1. **Gestión de Archivos de Comprobante:**
   - Crear disco o directorio en storage (`storage/app/public/ordenes_compra/pagos/`).
   - Endpoint `POST /v1/ordenes-compra/{id}/registrar-pago`:
     * Autorización: Solo rol `Contabilidad`, `Administrador`, `super_admin`.
     * Validación:
       - `comprobante`: `required|file|mimes:pdf,jpg,jpeg,png|max:5120` (5MB).
       - `fecha_pago`: `required|date`.
       - `referencia_transaccion`: `nullable|string|max:100`.
       - `observaciones`: `nullable|string|max:500`.
     * Guarda el archivo, asigna `pagado_por_id = auth()->id()`, `fecha_pago`, y transiciona la OC a `Pagada / Lista para Despacho`.

2. **Endpoint de Contingencia Post-Pago:**
   - `POST /v1/ordenes-compra/{id}/cancelar-pagada`:
     * Precondición: La OC debe estar en `Pagada / Lista para Despacho`.
     * Autorización: Rol `Contabilidad`, `Gerente Comercial` o `Administrador`.
     * Validación: `motivo_reembolso` obligatorio (`required|string|min:15|max:1000`).
     * Transiciona a `Cancelada - Reembolso Pendiente`.
     * Guarda el log y emite evento `OrdenCompraCanceladaPostPago`.

3. **Restricción en Portal de Proveedores:**
   - En `ProviderPortalController::purchaseOrders`, excluir las órdenes en estado `Cancelada - Reembolso Pendiente` o mostrarlas como "Cancelada - Operación Detenida" sin habilitar ningún botón de despacho.

### Frontend (Angular 21)

1. **Modal de Registro de Pago (`detail.component.ts`):**
   - Visible cuando la OC está en `Pendiente de Pago` y el usuario tiene rol `Contabilidad` o `Administrador`.
   - Diálogo con:
     * Campo fecha de pago (default hoy).
     * Input de archivo obligatorio con drag & drop o preview para el comprobante (PDF/imagen).
     * Referencia o número de transacción bancaria.
     * Botón "Confirmar y Registrar Pago".
   - Al completar, la orden muestra badge verde `Pagada / Lista para Despacho` y enlace para visualizar o descargar el comprobante adjunto.

2. **Botón de Emergencia "Cancelar Orden Pagada":**
   - Si la orden está en `Pagada / Lista para Despacho`:
     * Mostrar botón de advertencia/peligro: "Cancelar Orden Pagada (Reembolso)".
     * Al hacer clic, modal con confirmación de alto impacto y campo obligatorio de motivo de reembolso/siniestro.
     * Al confirmar, el badge cambia a rojo `Cancelada - Reembolso Pendiente`.

---

## Criterios de Aceptación (Definición de Done)

- [ ] Solo usuarios con rol `Contabilidad` o `Administrador` pueden registrar el pago.
- [ ] Es imposible registrar el pago sin adjuntar un comprobante válido (PDF o imagen).
- [ ] La orden transiciona a `Pagada / Lista para Despacho` y el comprobante queda accesible desde la vista de detalle.
- [ ] El botón de emergencia "Cancelar Orden Pagada" transiciona a `Cancelada - Reembolso Pendiente` exigiendo motivo.
- [ ] Una orden cancelada post-pago no permite despacho en el portal del proveedor.
- [ ] Tests de Feature de endpoints de pago y cancelación de emergencia en `heavy-api`.
- [ ] Validación de componentes en Angular con `ng lint`.

---

## Archivos Afectados (Estimación)

* `heavy-api/app/Http/Controllers/Api/V1/OrdenCompraController.php`
* `heavy-api/app/Services/OrdenCompraLifecycleService.php`
* `heavy-api/app/Policies/OrdenCompraPolicy.php`
* `heavy-front/src/app/core/services/orden-compra.service.ts`
* `heavy-front/src/app/features/ordenes-compra/detail/detail.component.ts`
* `heavy-front/src/app/features/provider-portal/ordenes-compra/ordenes-compra-list.component.ts`
