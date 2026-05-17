# Módulo Órdenes de Trabajo

## 1. Descripción General

El módulo de **Órdenes de Trabajo** gestina el flujo de logística interna después de que una cotización es aprobada. Su propósito es:

- **Rastrear repuestos**: Identificar qué repuestos llegan de proveedores y cuáles deben despacharse al cliente
- **Control de flujo**: Dar visibilidad al rol Logistica sobre el estado de cada ítem
- **Semaforización**: Sistema visual (verde/amarillo/rojo) para identificar rápidamente qué está listo, qué falta y qué no llegará

## 2. Modelo de Negocio

```
Cliente → Pedido → Cotización → [APROBADA] → Orden de Trabajo
                                                  ↓
                                        ┌─────────┴─────────┐
                                        ↓                   ↓
                              Repuestos por llegar   Repuestos por despachar
                                        ↓                   ↓
                              Proveedores → HeavyMarket → Cliente
```

**Flujo:**
1. Cliente realiza un pedido
2. Se genera cotización con múltiples proveedores
3. Cliente aprueba cotización
4. Se crea automáticamente una **Orden de Trabajo** con las referencias aprobadas
5. **Logistica** monitorea:
   - ¿Llegó el repuesto del proveedor? → Verde
   - ¿Aún está en tránsito/pendiente? → Amarillo
   - ¿No llegará / cancelado? → Rojo
6. Cuando todos los ítems están en verde → Se despacha al cliente

## 3. Estructura del Modelo

### Orden de Trabajo (Backend)

**Tabla:** `orden_trabajos`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | bigint | Identificador único |
| `cotizacion_id` | bigint | FK a cotizaciones - cotización origen |
| `pedido_id` | bigint | FK a pedidos - pedido origen |
| `tercero_id` | bigint | FK a terceros - cliente final |
| `estado` | enum | Estado general de la orden |
| `fecha_expedicion` | date | Fecha de creación |
| `observaciones` | text | Notas internas |
| `valor_total` | decimal | Valor total estimado |
| `timestamps` | timestamps | created_at, updated_at |

**Tabla Pivot:** `orden_trabajo_referencias`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | bigint | Identificador único |
| `orden_trabajo_id` | bigint | FK a orden_trabajos |
| `referencia_id` | bigint | FK a referencias |
| `cantidad` | int | Cantidad solicitada |
| `estado` | enum | Estado del ítem (llegó/pendiente/cancelado) |
| `notas` | text | Notas específicas del ítem |
| `timestamps` | timestamps | created_at, updated_at |
### Estados de la Orden (General)

| Estado | Descripción |
|--------|-------------|
| `Pendiente` | Creada, esperando recepción de repuestos |
| `En Proceso` | Al menos un ítem ha llegado o está en gestión |
| `Completado` | Todos los ítems marcados como recibidos y orden finalizada |
| `Cancelado` | La orden fue cancelada íntegramente |

## 4. Logística y Despacho
El módulo se integra con el catálogo de **Transportadoras**. Al despachar una orden, el personal de logística puede:
- Seleccionar la **Transportadora** encargada.
- Ingresar el **Número de Guía** para rastreo.
- Adjuntar el **Archivo/Foto** de la guía física o comprobante de despacho.

### Estados de los Ítems (Semaforización)

| Estado | Color | Descripción |
|--------|-------|-------------|
| `Pendiente` | 🟡 Amarillo | Esperando que el proveedor envíe |
| `Recibido` | 🟢 Verde | El repuesto llegó a bodega |
| `Cancelado` | 🔴 Rojo | El repuesto no llegará / cancelado |
| `Despachado` | 🟢 Verde | Ya enviado al cliente |

## 4. Endpoints de la API

### Base URL
```
GET/POST /v1/ordenes-trabajo
GET/PUT/DELETE /v1/ordenes-trabajo/{id}
```

### Listar Órdenes de Trabajo
```
GET /v1/ordenes-trabajo
```

**Parámetros Query:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | int | Página de paginación |
| `per_page` | int | Items por página |
| `estado` | string | Filtrar por estado |
| `tercero_id` | int | Filtrar por cliente |
| `cotizacion_id` | int | Filtrar por cotización |
| `search` | string | Búsqueda por observaciones |

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "cotizacion_id": 5,
      "pedido_id": 10,
      "tercero_id": 23,
      "estado": "Pendiente",
      "fecha_expedicion": "2026-05-01",
      "observaciones": "Urgente",
      "valor_total": 1500000,
      "referencias": [...],
      "created_at": "2026-05-01T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 15,
    "total": 45
  }
}
```

### Ver Detalle de Orden
```
GET /v1/ordenes-trabajo/{id}
```

**Respuesta:** Objeto completo con relaciones cargadas (tercero, cotizacion, pedido, referencias).

### Crear Orden de Trabajo
```
POST /v1/ordenes-trabajo
```

**Cuerpo:**
```json
{
  "cotizacion_id": 5,
  "pedido_id": 10,
  "tercero_id": 23,
  "fecha_expedicion": "2026-05-01",
  "observaciones": "Pedido urgente del cliente",
  "referencias": [
    { "referencia_id": 101, "cantidad": 2 },
    { "referencia_id": 102, "cantidad": 1 }
  ]
}
```

### Actualizar Orden de Trabajo
```
PUT /v1/ordenes-trabajo/{id}
```

**Cuerpo:** Mismo formato que store. Permite actualizar estado general y referencias.

### Eliminar Orden de Trabajo
```
DELETE /v1/ordenes-trabajo/{id}
```

### Actualizar Estado de Referencia (Ítem)
```
PATCH /v1/ordenes-trabajo/{id}/referencias/{referencia_id}
```

**Cuerpo:**
```json
{
  "estado": "Recibido",
  "notas": "Recibido en bodega, pendientes de revisión"
}
```

## 5. Integración con Otros Módulos

### Relación con Cotizaciones
- Una Orden de Trabajo se genera a partir de una **Cotización aprobada**
- Campo: `cotizacion_id` en `orden_trabajos`
- El sistema copia las referencias aprobadas de la cotización

### Relación con Pedidos
- Cada Orden de Trabajo belongs a un **Pedido**
- Campo: `pedido_id` en `orden_trabajos`
- Permite trazabilidad desde el pedido original

### Relación con Terceros (Clientes)
- Cada Orden de Trabajo tiene un **Tercero** como cliente final
- Campo: `tercero_id` en `orden_trabajos`

## 6. Permisos y Roles

| Rol | Permisos |
|-----|----------|
| `Super Admin` | CRUD completo |
| `Administrador` | CRUD completo |
| `Logistica` | Ver, actualizar estados, actualizar referencias |
| `Vendedor` | Solo lectura |
| `Analista` | Solo lectura |

## 7. Frontend - Uso

### Ruta
```
/app/ordenes-trabajo
```

### Vistas
| Vista | URL | Descripción |
|-------|-----|-------------|
| Listado | `/app/ordenes-trabajo` | Tabla con filtros, paginación y acciones |
| Crear | `/app/ordenes-trabajo/create` | Formulario para nueva orden |
| Detalle | `/app/ordenes-trabajo/{id}` | Vista completa con referencias |
| Editar | `/app/ordenes-trabajo/{id}/edit` | Editar orden y estados de ítems |

### Estado del Ítem en la UI
En la vista de detalle, cada referencia muestra un badge de color:
- 🟢 **Recibido** - Badge verde
- 🟡 **Pendiente** - Badge amarillo
- 🔴 **Cancelado** - Badge rojo
- 🟢 **Despachado** - Badge verde (con ícono de truck)

## 8. Casos de Uso Típicos

### Caso 1: Crear orden desde cotización aprobada
1. El usuario (Vendedor/Admin) aprueba una cotización
2. Sistema automáticamente crea Orden de Trabajo con las referencias de la cotización
3. Estado inicial: `Pendiente` (todos los ítems en 🟡)
4. Logistica comienza a recibir actualizaciones

### Caso 2: Actualizar estado de repuesto
1. Logistica recibe un repuesto del proveedor
2. Abre la Orden de Trabajo
3. Busca la referencia correspondiente
4. Cambia el estado a `Recibido`
5. El sistema actualiza el timestamp

### Caso 3: Marcar como cancelado
1. El proveedor informa que no puede entregar el repuesto
2. Logistica cambia el estado del ítem a `Cancelado`
3. La orden puede marcarse como `Cancelada` si todas las referencias fallan

### Caso 4: Despachar al cliente
1. Todos los repuestos marcados como `Recibido`
2. Logistica hace el despacho
3. Actualiza estado de cada ítem a `Despachado`
4. La orden pasa a `Completa`

## 9. Validaciones del Backend

### Crear Orden (StoreOrdenTrabajoRequest)
- `cotizacion_id`: Requerido, debe existir, debe estar aprobada
- `pedido_id`: Requerido, debe existir
- `tercero_id`: Requerido, debe existir
- `referencias`: Array requerido, al menos 1 ítem
- Cada referencia: `referencia_id` y `cantidad` requeridos

### Actualizar Estado de Ítem
- Solo usuario con rol Logistica o superior puede cambiar a `Cancelado`
- Solo puede cambiar a `Recibido` si existe evidencia de recepción (fecha_recepcion)

## 10. Historial de Cambios (Pendiente)

Aún no implementado. Se recomienda agregar:
- Tabla `orden_trabajo_historial` para registrar cambios de estado
- Triggers o eventos para capturar: quién, cuándo, qué cambió

## 11. Pendientes de Desarrollo

- [x] Policy de autorización (`OrdenTrabajoPolicy`)
- [x] FormRequest para Update (`UpdateOrdenTrabajoRequest`)
- [ ] Tests de integración
- [ ] Endpoint para actualizar estado individual de referencia
- [ ] Generación de PDF de la orden
- [ ] Notificaciones cuando ítem cambia a "Recibido"
- [ ] Historial de cambios

---

*Documento creado: Mayo 2026*
*Última actualización: Mayo 2026*