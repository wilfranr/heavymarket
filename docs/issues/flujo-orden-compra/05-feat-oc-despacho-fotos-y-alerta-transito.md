# feat: Despacho con Evidencias Fotográficas y Alerta de Tránsito Prolongado

**Tipo:** Feature  
**Prioridad:** Media / Alta  
**Módulo:** Portal de Proveedores / Órdenes de Compra (Backend + Frontend)  
**Dependencias:** `01-feat-oc-maquina-estados-y-permisos.md`, `04-feat-oc-registro-pago-y-contingencia.md`  
**Issue relacionado:** Epic [flujo-orden-compra](README.md)

---

## Contexto

El Paso 5 del cliente establece la etapa de transporte y monitoreo logístico:
* **Precondición:** La OC se encuentra en estado `Pagada / Lista para Despacho`.
* **Acción del Proveedor:** Hace clic en "Despachar".
  - Debe adjuntar obligatoriamente guías de transporte y fotos del paquete/embalaje.
* **Post-condición:** La OC pasa a `En Tránsito`. Se habilitan los controles para el equipo de Logística.
* **Automatización (Cron Job):**
  - El sistema debe verificar diariamente las OC en estado `En Tránsito`.
  - Si una orden excede "X" días en tránsito (parámetro configurable en `config/compras.php`, ej. 5 días hábiles), debe generar una **"Alerta de Tránsito Prolongado"**, notificando a Logística y al Asesor responsable para el rastreo oportuno de la carga.

---

## Propuesta Técnica

### Backend (Laravel 13)

1. **Tabla / Relación de Archivos de Despacho:**
   - Tabla `orden_compra_despacho_archivos` o reutilización de polimorfismo con campos:
     * `orden_compra_id`, `tipo` (`'guia'` o `'foto_paquete'`), `ruta`, `nombre_original`.
   - Modificar endpoint `POST /v1/provider-portal/ordenes-compra/{id}/dispatch`:
     * Validar:
       - `transportadora_id`: `required|exists:transportadoras,id`
       - `guia`: `required|string|max:100`
       - `fecha_despacho`: `required|date`
       - `fotos`: `required|array|min:1` (al menos 1 archivo adjunto fotográfico o guía digital).
       - `fotos.*`: `file|mimes:jpg,jpeg,png,pdf|max:10240`
     * Almacenar archivos y transicionar a `En Tránsito`.

2. **Comando Cron Job de Alerta (`AlertarTransitoProlongadoCommand`):**
   - Crear comando Artisan: `php artisan compras:alertar-transito-prolongado`.
   - Consulta: `OrdenCompra::where('estado', OrdenCompraEstado::EnTransito)->where('fecha_despacho', '<=', now()->subDays($diasLimite))`.
   - Genera notificaciones en el sistema (vía base de datos o correo) para usuarios con rol `Logistica` y el `user_id` asesor de la orden.
   - Registrar el comando en el scheduler (`routes/console.php`).

### Frontend (Angular 21)

1. **Portal de Proveedores (`features/provider-portal/ordenes-compra/`):**
   - En el `displayDispatch` dialog, agregar componente de subida de archivos múltiple (fotos del paquete y guía).
   - Validar que el botón "Confirmar Despacho" permanezca deshabilitado si no hay al menos una foto/archivo cargado.

2. **Detalle de OC Interno (`features/ordenes-compra/detail/`):**
   - Mostrar sección de "Evidencias de Despacho del Proveedor" con galería/thumbnails y enlace de descarga.
   - Si la orden sobrepasa los días configurados en tránsito, mostrar badge o banner de advertencia parpadeante:
     * *"Alerta: Tránsito Prolongado (X días en tránsito sin confirmación de entrega)"*.

---

## Criterios de Aceptación (Definición de Done)

- [ ] El proveedor no puede despachar sin ingresar transportadora, guía y al menos un archivo fotográfico o documento.
- [ ] La orden transiciona a `En Tránsito` tras registrar el despacho.
- [ ] Las fotos y guías son visibles en el panel de detalle de la OC para Logística y Asesores.
- [ ] Comando `compras:alertar-transito-prolongado` identifica correctamente las órdenes vencidas y genera las alertas.
- [ ] Tests unitarios y funcionales del comando de consola y del despacho en portal.

---

## Archivos Afectados (Estimación)

* `heavy-api/database/migrations/xxxx_xx_xx_create_orden_compra_despacho_archivos_table.php`
* `heavy-api/app/Console/Commands/AlertarTransitoProlongadoCommand.php`
* `heavy-api/routes/console.php`
* `heavy-api/app/Http/Controllers/Api/V1/ProviderPortalController.php`
* `heavy-front/src/app/features/provider-portal/ordenes-compra/ordenes-compra-list.component.ts`
* `heavy-front/src/app/features/ordenes-compra/detail/detail.component.ts`
