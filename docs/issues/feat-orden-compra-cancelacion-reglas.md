# feat: Reglas de cancelacion automatica y manual para Ordenes de Compra

**Tipo:** Feature
**Prioridad:** Alta
**Modulo:** Ordenes de Compra (Backend)
**Dependencias:** #144 (Ciclo de vida de estados OC), #145 (Snapshot proveedor OC)

---

## Contexto

No todas las OCs deberian cancelarse manualmente. La regla fundamental es: **si la OC todavia no salio de la empresa, el sistema puede cancelarla automaticamente; si ya fue enviada al proveedor, la cancelacion debe gestionarse manualmente.**

Actualmente no existe logica diferenciada de cancelacion. El sistema trata todas las OCs igual, lo que puede generar compras duplicadas o compromisos comerciales no resueltos con proveedores.

---

## Escenario Base

```
Pedido PED-100: 2 alternadores

Costeo v1:
  Proveedor: Repuestos ABC
  Costo unitario: $800.000

Cotizacion v1:
  Venta total: $2.000.000
  Estado: Aprobada

Sistema genera:
  OC-001
  Proveedor: Repuestos ABC
  Cantidad: 2
  Precio unitario: $800.000
  Estado: Borrador
  Origen: Cotizacion v1
```

---

## Casos de Cancelacion

### Caso 1: OC en Borrador + cambio de costo

El proveedor informa que el alternador ahora cuesta $900.000. El vendedor genera Costeo v2 y Cotizacion v2. El cliente aprueba.

**Comportamiento del sistema (automatico):**

```
OC-001: Borrador -> Cancelada
  Motivo: "Reemplazada por Cotizacion v2"
  Tipo: Automatica por reemplazo

OC-002 (nueva):
  Proveedor: Repuestos ABC
  Cantidad: 2
  Precio unitario: $900.000
  Estado: Borrador
  Origen: Cotizacion v2
```

Ambas operaciones ocurren en la misma transaccion: cancelar OCs no enviadas de versiones anteriores y generar las nuevas.

### Caso 2: OC Pendiente de envio + nueva cotizacion

```
OC-001: Pendiente de envio -> Cancelada
  Motivo: "Reemplazada por Cotizacion v2"
  Tipo: Automatica por reemplazo
```

Aunque estuviera lista para salir, todavia no salio del edificio digital. Sigue siendo documento interno.

### Caso 3: OC Enviada al proveedor

La OC ya fue comunicada al proveedor. Puede haber ocurrido:
- El proveedor comenzo a prepararla
- Separo inventario
- Realizo una importacion
- Genero una factura
- Despacho sin avisar
- Acepto condiciones comerciales

**Comportamiento del sistema (bloqueo):**

Al intentar aprobar la cotizacion v2, el sistema advierte:

> El pedido tiene una OC enviada al proveedor.
> OC-001 -- Repuestos ABC -- $1.600.000
> Debe resolverla antes de generar nuevas ordenes.

El usuario debe:
1. Comunicarse con el proveedor
2. Confirmar que la OC puede cancelarse
3. Ejecutar la accion de cancelacion en el sistema
4. Registrar motivo y evidencia
5. Entonces se habilita la generacion de nueva OC

### Caso 4: OC Enviada pero proveedor rechaza

```
OC-001: Enviada -> Cancelada (manual)
  Motivo: "Proveedor sin disponibilidad"
  Tipo: Manual por proveedor
  Responsable: Usuario que registra
```

Aunque el proveedor haya rechazado, un usuario debe formalizar la cancelacion. El sistema no puede interpretar correos ni comunicaciones externas.

### Caso 5: OC Confirmada por el proveedor

El proveedor ya acepto la orden. La cancelacion es obligatoriamente manual y puede requerir autorizacion de administrador.

Campos requeridos para cancelacion:
- Motivo de cancelacion
- Confirmacion del proveedor
- Costos o penalizaciones
- Observaciones
- Adjunto de evidencia

Si el proveedor no permite cancelarla, la OC sigue activa. La nueva cotizacion no debe crear otra compra por las mismas unidades.

### Caso 6: OC con recepcion parcial

```
OC-001:
  Cantidad solicitada: 10
  Cantidad recibida: 4
  Cantidad pendiente: 6
  Estado: Recibida parcialmente
```

No se cancela toda la OC. Las 4 unidades recibidas son una operacion real.

**Comportamiento:**

```
OC-001 -> Cerrada
  Motivo: "Saldo pendiente cancelado por cambio de proveedor"
  Cantidad recibida: 4
  Cantidad pendiente cancelada: 6

OC-002 (nueva, solo por faltante):
  Cantidad: 6
```

Esto requiere que el detalle de la OC distinga: `cantidad_ordenada`, `cantidad_recibida`, `cantidad_cancelada`, `cantidad_pendiente`.

---

## Matriz de Decision

| Estado actual de la OC | Cancelacion automatica? | Generar nueva OC inmediatamente? |
|------------------------|------------------------|----------------------------------|
| Borrador | Si | Si |
| Pendiente de envio | Si | Si |
| Enviada | No | No, hasta resolverla |
| Confirmada | No | No, hasta resolverla |
| Recibida parcialmente | No | Solo por cantidades pendientes |
| Recibida | No aplica | No por las mismas unidades |
| Cerrada | No aplica | No |
| Cancelada | No aplica | Si |

---

## Logica de Aprobacion de Nueva Cotizacion

Al aprobar una nueva version de cotizacion, el sistema ejecuta:

```php
foreach ($ordenesAnteriores as $ordenCompra) {
    match ($ordenCompra->estado) {
        OrdenCompraEstado::BORRADOR,
        OrdenCompraEstado::PENDIENTE_ENVIO
            => $this->cancelarPorReemplazo($ordenCompra, $nuevaCotizacion),

        OrdenCompraEstado::ENVIADA,
        OrdenCompraEstado::CONFIRMADA,
        OrdenCompraEstado::RECIBIDA_PARCIALMENTE
            => throw ValidationException::withMessages([
                'cotizacion' => sprintf(
                    'La OC %s debe resolverse antes de generar nuevas ordenes.',
                    $ordenCompra->id,
                ),
            ]),

        default => null,
    };
}
```

---

## Requerimientos Tecnicos

### Backend

1. **Campos de cancelacion en `orden_compras`** (migracion):

   | Campo | Tipo | Descripcion |
   |-------|------|-------------|
   | `cancelada_at` | `datetime, nullable` | Fecha/hora de cancelacion |
   | `cancelada_por` | `foreignId(users), nullable` | Usuario que cancelo |
   | `motivo_cancelacion` | `text, nullable` | Razon de la cancelacion |
   | `tipo_cancelacion` | `string, nullable` | Tipo (ver Enum abajo) |
   | `cotizacion_reemplazo_id` | `foreignId(cotizaciones), nullable` | Cotizacion que la reemplaza |
   | `orden_compra_reemplazo_id` | `foreignId(orden_compras), nullable` | OC que la reemplaza |

2. **Enum `TipoCancelacionOC`** en `app/Enums/TipoCancelacionOC.php`:

   ```php
   enum TipoCancelacionOC: string
   {
       case AUTOMATICA_REEMPLAZO = 'automatica_reemplazo';
       case MANUAL_PROVEEDOR     = 'manual_proveedor';
       case MANUAL_CLIENTE       = 'manual_cliente';
       case MANUAL_ERROR_INTERNO = 'manual_error_interno';
   }
   ```

3. **Campos de cantidades en `orden_compra_referencia`** (migracion):

   | Campo | Tipo | Descripcion |
   |-------|------|-------------|
   | `cantidad_ordenada` | `integer` | Cantidad original solicitada |
   | `cantidad_recibida` | `integer, default 0` | Cantidad recibida |
   | `cantidad_cancelada` | `integer, default 0` | Cantidad cancelada del saldo |
   | `cantidad_pendiente` | `integer, generated` | = ordenada - recibida - cancelada |

4. **Metodo `cancelarPorReemplazo()`** en `CotizacionService`:

   ```php
   private function cancelarPorReemplazo(
       OrdenCompra $oc,
       Cotizacion $nuevaCotizacion,
       ?OrdenCompra $nuevaOC = null
   ): void {
       $oc->update([
           'estado' => 'Cancelada',
           'cancelada_at' => now(),
           'cancelada_por' => auth()->id(),
           'motivo_cancelacion' => sprintf(
               'Cancelada automaticamente por aprobacion de Cotizacion %s. Reemplazada por OC %s.',
               $nuevaCotizacion->id,
               $nuevaOC?->id ?? 'pendiente'
           ),
           'tipo_cancelacion' => TipoCancelacionOC::AUTOMATICA_REEMPLAZO->value,
           'cotizacion_reemplazo_id' => $nuevaCotizacion->id,
           'orden_compra_reemplazo_id' => $nuevaOC?->id,
       ]);
   }
   ```

5. **Metodo `validarOCsActivas()`** en `CotizacionService`:

   - Antes de generar nuevas OCs, verificar que no existan OCs en estados `Enviada`, `Confirmada` o `Recibida parcialmente` para el mismo pedido.
   - Si existen, lanzar `ValidationException` con detalle de las OCs bloqueantes.

6. **Actualizar `CotizacionService::aprobar()`**:

   - Integrar logica de cancelacion automatica + validacion de bloqueo.
   - Orden de operaciones en la transaccion:
     1. Validar OCs activas (bloquear si existen).
     2. Cancelar OCs en Borrador/Pendiente de envio.
     3. Transitar pedido a Aprobado.
     4. Marcar cotizacion como Aprobada.
     5. Rechazar cotizaciones anteriores.
     6. Crear Orden de Trabajo.
     7. Crear nuevas OCs.

7. **Endpoint de cancelacion manual** `POST /api/v1/ordenes-compra/{id}/cancel`:

   - Recibe: `motivo_cancelacion`, `tipo_cancelacion`, `evidencia` (archivo opcional).
   - Valida que el estado permita cancelacion.
   - Si estado es `Confirmada`, requiere rol `Administrador` o `super_admin`.
   - Registra todos los campos de cancelacion.

8. **Endpoint de cierre parcial** `POST /api/v1/ordenes-compra/{id}/close-partial`:

   - Recibe: array de `referencia_id` + `cantidad_cancelada`.
   - Actualiza cantidades en el detalle.
   - Si `cantidad_pendiente = 0` para todas las referencias, transiciona a `Cerrada`.

9. **Tests**:

   - Test: OC en Borrador se cancela automaticamente al aprobar nueva cotizacion.
   - Test: OC en Pendiente de envio se cancela automaticamente.
   - Test: OC Enviada bloquea generacion de nueva OC.
   - Test: OC Confirmada bloquea generacion de nueva OC.
   - Test: OC Recibida parcialmente permite nueva OC solo por saldo.
   - Test: Cancelacion manual requiere motivo obligatorio.
   - Test: Cancelacion de OC Confirmada requiere rol Admin.
   - Test: Cierre parcial actualiza cantidades correctamente.

### Frontend

1. **Modal de cancelacion manual**:
   - Campos: motivo (obligatorio), tipo de cancelacion (select), evidencia (upload).
   - Confirmacion adicional si estado es `Confirmada`.

2. **Alerta de bloqueo al aprobar cotizacion**:
   - Si existen OCs activas, mostrar listado con estados.
   - Mensaje: "No se pueden generar nuevas ordenes de compra porque existen ordenes activas de una cotizacion anterior. Cancele o resuelva las ordenes anteriores para continuar."

3. **Vista de detalle de OC**:
   - Mostrar datos de cancelacion si aplica (motivo, tipo, fecha, usuario, OC reemplazo).
   - Mostrar cantidades: ordenada, recibida, cancelada, pendiente.

4. **Accion de cierre parcial**:
   - Modal con tabla de referencias y campos de cantidad a cancelar.
   - Solo disponible en estado `Recibida parcialmente`.

---

## Criterios de Aceptacion (Definicion de Done)

- [ ] Migracion con campos de cancelacion en `orden_compras` ejecutada.
- [ ] Migracion con campos de cantidades en `orden_compra_referencia` ejecutada.
- [ ] Enum `TipoCancelacionOC` creado con 4 casos.
- [ ] `CotizacionService::aprobar()` cancela automaticamente OCs en Borrador y Pendiente de envio.
- [ ] `CotizacionService::aprobar()` bloquea generacion si existen OCs Enviada/Confirmada/Recibida parcialmente.
- [ ] Endpoint `POST /ordenes-compra/{id}/cancel` funcional con validacion de estados y roles.
- [ ] Endpoint `POST /ordenes-compra/{id}/close-partial` funcional con calculo de cantidades.
- [ ] Frontend muestra alerta de bloqueo con listado de OCs activas.
- [ ] Frontend tiene modal de cancelacion manual con motivo y evidencia.
- [ ] Frontend muestra datos de cancelacion en detalle de OC.
- [ ] Tests de cancelacion automatica pasan (Borrador, Pendiente de envio).
- [ ] Tests de bloqueo pasan (Enviada, Confirmada, Recibida parcialmente).
- [ ] Tests de cancelacion manual pasan (con motivo, con rol Admin para Confirmada).
- [ ] `php artisan test` sin fallos.
- [ ] `./vendor/bin/pint` sin errores.

---

## Notas de Implementacion

### No usar SoftDeletes

Una OC cancelada sigue siendo parte del historial del negocio. No se elimina ni se oculta. Se mantiene visible con estado `Cancelada` y todos los datos de auditoria de cancelacion.

### Trazabilidad completa

Toda cancelacion debe registrar:
- Fecha y hora exacta (`cancelada_at`).
- Usuario responsable (`cancelada_por`) o proceso automatico.
- Motivo descriptivo (`motivo_cancelacion`).
- Tipo de cancelacion (`tipo_cancelacion`).
- Referencia a la cotizacion que la reemplaza (`cotizacion_reemplazo_id`).
- Referencia a la OC que la reemplaza (`orden_compra_reemplazo_id`).

### Archivos afectados (estimacion)

**Backend:**
- `database/migrations/xxxx_add_cancelacion_fields_to_orden_compras.php` (nuevo)
- `database/migrations/xxxx_add_cantidades_to_orden_compra_referencia.php` (nuevo)
- `app/Enums/TipoCancelacionOC.php` (nuevo)
- `app/Services/CotizacionService.php` (modificar `aprobar()`, agregar `cancelarPorReemplazo()`, `validarOCsActivas()`)
- `app/Http/Controllers/Api/V1/OrdenCompraController.php` (agregar `cancel()`, `closePartial()`)
- `app/Http/Requests/CancelOrdenCompraRequest.php` (nuevo)
- `app/Http/Requests/ClosePartialOrdenCompraRequest.php` (nuevo)
- `app/Models/OrdenCompra.php` (actualizar `$fillable`)
- `app/Models/OrdenCompraReferencia.php` (actualizar `$fillable`, agregar scopes)
- `tests/Feature/OrdenCompraCancelacionTest.php` (nuevo)
- `tests/Feature/OrdenCompraCierreParcialTest.php` (nuevo)
- `tests/Unit/Enums/TipoCancelacionOCTest.php` (nuevo)

**Frontend:**
- `src/app/core/models/orden-compra.ts` (agregar campos de cancelacion y cantidades)
- `src/app/features/ordenes-compra/detail/` (modal cancelacion, datos de cancelacion, cierre parcial)
- `src/app/features/cotizaciones/detail/` (alerta de bloqueo al aprobar)
