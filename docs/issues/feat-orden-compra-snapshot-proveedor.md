# feat: Agregar snapshot de datos del proveedor en Órdenes de Compra

**Tipo:** Feature
**Prioridad:** Alta
**Módulo:** Órdenes de Compra (Backend + Frontend)
**Dependencias:** Ninguna

---

## Contexto

Actualmente, la Orden de Compra mantiene únicamente la relación foránea `proveedor_id` hacia la tabla `terceros`. Todos los datos del proveedor (nombre, email, teléfono, dirección, contacto) se resuelven dinámicamente vía la relación Eloquent `$ordenCompra->proveedor->email`.

Esto genera un problema de **integridad histórica**: si el proveedor actualiza sus datos en el sistema, todas las OCs previas reflejarán los datos nuevos en lugar de los datos con los que fueron emitidas originalmente.

## Problema

### Escenario

1. Hoy se emite una OC con estos datos del proveedor:
   - Proveedor: Repuestos Garcia SAS
   - Correo: ventas@garcia.com
   - Direccion: Calle 10 # 20-30

2. Tres meses despues, el proveedor actualiza sus datos:
   - Correo: comercial@garcia.com
   - Direccion: Carrera 50 # 10-15

3. Al regenerar el PDF o consultar la OC antigua, el sistema muestra:
   ```php
   $ordenCompra->proveedor->email  // comercial@garcia.com (INCORRECTO)
   ```
   En lugar de:
   ```php
   $ordenCompra->proveedor_email   // ventas@garcia.com (CORRECTO)
   ```

El documento historico queda falseado. Esto afecta:
- **PDFs regenerados**: Muestran datos actuales en documentos antiguos.
- **Auditoria**: Imposibilidad de verificar contra que datos se emitio la OC.
- **Legal/Contable**: Documentos emitidos con datos que no corresponden a la realidad del momento.

---

## Solucion Propuesta

Mantener **ambas cosas**: la relacion FK (`proveedor_id`) para navegacion y consultas, y campos de snapshot con los datos historicos del proveedor al momento de la emision.

### Campos a agregar en `orden_compras`

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `proveedor_nombre` | `string` | Razon social del proveedor |
| `proveedor_documento` | `string(30), nullable` | Numero de documento/NIT |
| `proveedor_email` | `string, nullable` | Correo electronico al momento de la OC |
| `proveedor_telefono` | `string(30), nullable` | Telefono al momento de la OC |
| `proveedor_contacto` | `string, nullable` | Persona de contacto al momento de la OC |
| `proveedor_direccion` | `text, nullable` | Direccion al momento de la OC |

### Estructura de migracion

```php
Schema::table('orden_compras', function (Blueprint $table) {
    $table->string('proveedor_nombre')->after('proveedor_id');
    $table->string('proveedor_documento', 30)->nullable()->after('proveedor_nombre');
    $table->string('proveedor_email')->nullable()->after('proveedor_documento');
    $table->string('proveedor_telefono', 30)->nullable()->after('proveedor_email');
    $table->string('proveedor_contacto')->nullable()->after('proveedor_telefono');
    $table->text('proveedor_direccion')->nullable()->after('proveedor_contacto');
});
```

---

## Requerimientos Tecnicos

### Backend

1. **Crear migracion** para agregar los 6 campos snapshot a `orden_compras`.

2. **Actualizar `OrdenCompra` Model** (`app/Models/OrdenCompra.php`):
   - Agregar los 6 campos a `$fillable`.
   - Mantener la relacion `proveedor()` intacta.

3. **Actualizar `CotizacionService::crearOrdenCompra()`** (`app/Services/CotizacionService.php`):
   - Al crear la OC, capturar snapshot del proveedor:
     ```php
     $proveedor = Tercero::with(['contactos', 'direcciones'])->find($proveedorId);
     $contacto = $proveedor->contactos->first();
     $direccion = $proveedor->direcciones->first();

     OrdenCompra::create([
         // ... campos existentes ...
         'proveedor_nombre'    => $proveedor->nombre,
         'proveedor_documento' => $proveedor->numero_documento,
         'proveedor_email'     => $contacto?->email,
         'proveedor_telefono'  => $contacto?->telefono,
         'proveedor_contacto'  => $contacto?->nombre,
         'proveedor_direccion' => $direccion?->direccion,
     ]);
     ```

4. **Actualizar `OrdenCompraController::store()`** (`app/Http/Controllers/Api/V1/OrdenCompraController.php`):
   - Capturar snapshot del proveedor al crear OC manualmente.
   - Agregar campos a FormRequests (`StoreOrdenCompraRequest`, `UpdateOrdenCompraRequest`).

5. **Actualizar `OrdenCompraResource`** (`app/Http/Resources/OrdenCompraResource.php`):
   - Exponer los 6 campos snapshot en la respuesta JSON.
   - Mantener datos del proveedor relacional para navegacion.

6. **Actualizar plantilla PDF** (`resources/views/pdf/orden_compra.blade.php`):
   - Reemplazar `$ordenCompra->proveedor->email` por `$ordenCompra->proveedor_email`.
   - Reemplazar `$ordenCompra->proveedor->nombre` por `$ordenCompra->proveedor_nombre`.
   - Aplicar cambio en todos los campos que usan datos del proveedor en el PDF.

7. **Migracion de datos existentes**:
   - Script para poblar campos snapshot de OCs existentes usando datos actuales del proveedor (con nota de que son datos aproximados, no historicos exactos).

8. **Tests**:
   - Test feature: verificar que al crear OC se capturan los datos snapshot.
   - Test feature: verificar que al actualizar proveedor, la OC mantiene datos originales.
   - Test unitario: verificar que el PDF usa campos snapshot.

### Frontend

1. **Actualizar modelo `OrdenCompra`** (`core/models/orden-compra.ts`):
   - Agregar campos: `proveedor_nombre`, `proveedor_documento`, `proveedor_email`, `proveedor_telefono`, `proveedor_contacto`, `proveedor_direccion`.

2. **Actualizar vista de detalle de OC**:
   - Mostrar datos snapshot del proveedor en lugar de datos relacionales.
   - Mantener enlace al perfil del proveedor via `proveedor_id`.

3. **Actualizar generacion de PDF (si aplica en frontend)**:
   - Usar campos snapshot para previsualizacion.

---

## Criterios de Aceptacion (Definicion de Done)

- [ ] Migracion ejecutada con los 6 campos snapshot en `orden_compras`.
- [ ] `CotizacionService::crearOrdenCompra()` captura snapshot del proveedor automaticamente.
- [ ] `OrdenCompraController::store()` captura snapshot al crear OC manualmente.
- [ ] `OrdenCompraResource` expone los campos snapshot en la API.
- [ ] Plantilla PDF `orden_compra.blade.php` usa campos snapshot (no relacionales).
- [ ] OCs existentes tienen datos snapshot poblados (script de migracion).
- [ ] Frontend muestra datos snapshot en detalle de OC.
- [ ] Test: al actualizar proveedor, OC antigua mantiene datos originales.
- [ ] Test: al crear OC, se capturan datos snapshot correctamente.
- [ ] `php artisan test` sin fallos.
- [ ] `./vendor/bin/pint` sin errores de estilo.

---

## Notas de Implementacion

### Cual contacto y direccion usar

Un proveedor puede tener multiples contactos y direcciones. Para el snapshot se propone:
- **Contacto**: Usar el contacto principal (primer registro o marcado como `principal = true` si existe el campo).
- **Direccion**: Usar la direccion principal o la direccion de despacho asociada a la OC.

Si el flujo de creacion de OC permite seleccionar contacto y direccion especificos, el snapshot debe capturar esos.

### Archivos afectados (estimacion)

**Backend:**
- `database/migrations/xxxx_add_proveedor_snapshot_to_orden_compras.php` (nuevo)
- `app/Models/OrdenCompra.php` (modificar `$fillable`)
- `app/Services/CotizacionService.php` (modificar `crearOrdenCompra()`)
- `app/Http/Controllers/Api/V1/OrdenCompraController.php` (modificar `store()`)
- `app/Http/Requests/StoreOrdenCompraRequest.php` (agregar campos)
- `app/Http/Requests/UpdateOrdenCompraRequest.php` (agregar campos)
- `app/Http/Resources/OrdenCompraResource.php` (exponer campos)
- `resources/views/pdf/orden_compra.blade.php` (usar snapshot)
- `database/seeders/BackfillProveedorSnapshotSeeder.php` (nuevo, datos existentes)
- `tests/Feature/OrdenCompraSnapshotTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-compra.ts` (agregar campos)
- `src/app/features/ordenes-compra/detail/` (mostrar snapshot)
