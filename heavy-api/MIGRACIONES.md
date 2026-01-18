# Gestión de Migraciones - HeavyMarket API

## Situación del Proyecto

### Base de Datos Existente
Este proyecto **NO parte de cero**. Utilizamos la base de datos `cyhfilament` del proyecto CYH existente, que contiene:

- ✅ **53 tablas** completamente funcionales
- ✅ **38 modelos Eloquent** migrados
- ✅ **Datos reales** de producción
- ✅ **Estructura consolidada** y optimizada

### Estrategia de Migraciones

```
Proyecto CYH (Original)           Proyecto HeavyMarket (Nuevo)
├── BD cyhfilament (53 tablas)    ├── Usa MISMA BD cyhfilament
├── Migraciones consolidadas      ├── Migraciones copiadas
└── Modelos funcionando           └── Modelos adaptados
```

## Estructura Actual de Migraciones

### Migraciones Activas (9 archivos)

```bash
database/migrations/
├── 2025_08_23_000001_consolidate_core_system_tables.php
├── 2025_08_23_000002_consolidate_business_module_tables.php
├── 2025_08_23_000003_consolidate_operations_module_tables.php
├── 2025_08_23_000004_fix_auto_increment_ids.php
├── 2025_08_23_000005_fix_terceros_auto_increment_with_constraints.php
├── 2025_12_14_071802_create_categorias_table.php
├── 2025_12_14_085334_add_navbar_fields_to_subcategorias_landing_table.php
├── 2025_12_14_090020_add_imagen_to_subcategorias_landing_table.php
└── 2026_01_18_141838_create_sessions_table.php
```

### Migraciones Eliminadas (5 archivos)

Estas migraciones fueron eliminadas porque las tablas **ya existen** en la BD:

```bash
❌ 0001_01_01_000000_create_users_table.php
   → Tabla 'users' ya existe en cyhfilament

❌ 0001_01_01_000001_create_cache_table.php
   → Tabla 'cache' ya existe en cyhfilament

❌ 0001_01_01_000002_create_jobs_table.php
   → Tabla 'jobs' ya existe en cyhfilament

❌ 2026_01_18_125541_create_permission_tables.php
   → Tablas de Spatie Permission ya existen

❌ 2026_01_18_125542_create_personal_access_tokens_table.php
   → Tabla de Sanctum ya existe
```

## Estado de las Migraciones

```bash
php artisan migrate:status
```

```
Migration name                                                   Batch / Status
2025_08_23_000001_consolidate_core_system_tables ................ [50] Ran
2025_08_23_000002_consolidate_business_module_tables ............ [50] Ran
2025_08_23_000003_consolidate_operations_module_tables .......... [50] Ran
2025_08_23_000004_fix_auto_increment_ids ........................ [50] Ran
2025_08_23_000005_fix_terceros_auto_increment_with_constraints .. [50] Ran
2025_12_14_071802_create_categorias_table ....................... [50] Ran
2025_12_14_085334_add_navbar_fields_to_subcategorias_landing ... [51] Ran
2025_12_14_090020_add_imagen_to_subcategorias_landing_table ..... [52] Ran
2026_01_18_141838_create_sessions_table ......................... [53] Ran
```

## Tablas del Sistema

### Tablas de Laravel (53 total)

La base de datos incluye todas las tablas necesarias para el funcionamiento del sistema:

**Core del Sistema:**
- `users` - Usuarios del sistema
- `roles` - Roles de usuario
- `permissions` - Permisos
- `model_has_permissions` - Permisos por modelo
- `model_has_roles` - Roles por modelo
- `role_has_permissions` - Permisos por rol
- `personal_access_tokens` - Tokens de API (Sanctum)
- `sessions` - Sesiones de usuario
- `cache` - Sistema de caché
- `cache_locks` - Bloqueos de caché
- `jobs` - Cola de trabajos
- `job_batches` - Lotes de trabajos
- `failed_jobs` - Trabajos fallidos
- `migrations` - Control de migraciones

**Módulo de Negocio:**
- `pedidos` - Pedidos de clientes
- `cotizaciones` - Cotizaciones
- `ordenes_compra` - Órdenes de compra
- `referencias` - Referencias de pedidos
- `articulos` - Artículos
- `articulos_referencias` - Relación artículos-referencias
- `referencias_proveedor` - Referencias de proveedores
- `terceros` - Clientes y proveedores
- `contactos` - Contactos de terceros
- `direcciones` - Direcciones de envío
- `maquinas` - Maquinaria
- `fabricantes` - Fabricantes
- `listas` - Listas de precios
- `items_lista` - Items de lista
- `ubicaciones` - Ubicaciones de inventario
- `notas` - Notas del sistema

**Módulo de Operaciones:**
- `movimientos_inventario` - Movimientos de inventario
- `tipo_movimientos` - Tipos de movimiento
- `unidades_medida` - Unidades de medida
- `categorias` - Categorías de productos
- `subcategorias` - Subcategorías
- `categorias_landing` - Categorías para landing page
- `subcategorias_landing` - Subcategorías para landing page

**Sistema de Comunicación:**
- `ch_favorites` - Favoritos de chat
- `ch_messages` - Mensajes de chat
- `notifications` - Notificaciones
- `websockets_statistics_entries` - Estadísticas de WebSockets

## Comandos Importantes

### Ver estado de migraciones
```bash
php artisan migrate:status
```

### Ejecutar migraciones pendientes
```bash
php artisan migrate
```

### Ver lista de tablas
```bash
php artisan db:show
```

### Verificar si una tabla existe
```bash
php artisan tinker --execute="echo \Illuminate\Support\Facades\Schema::hasTable('nombre_tabla') ? 'Existe' : 'No existe';"
```

## Reglas para Nuevas Migraciones

### ✅ HACER:

1. **Crear migraciones para nuevas tablas**
   ```bash
   php artisan make:migration create_nueva_tabla_table
   ```

2. **Crear migraciones para modificar tablas existentes**
   ```bash
   php artisan make:migration add_campo_to_tabla_table
   ```

3. **Probar migraciones en ambiente local antes de producción**
   ```bash
   php artisan migrate --pretend
   ```

4. **Usar rollback solo en desarrollo**
   ```bash
   php artisan migrate:rollback
   ```

### ❌ NO HACER:

1. ❌ **NO ejecutar `migrate:fresh` en producción** - Borra toda la BD
2. ❌ **NO ejecutar `migrate:reset` en producción** - Revierte todo
3. ❌ **NO eliminar migraciones ya ejecutadas** - Rompe el control de versiones
4. ❌ **NO modificar migraciones ejecutadas** - Crea inconsistencias

## Troubleshooting

### Error: "Base table or view already exists"

**Causa:** Intentas crear una tabla que ya existe.

**Solución:**
```bash
# 1. Verificar si la tabla existe
php artisan tinker --execute="echo Schema::hasTable('nombre_tabla') ? 'Existe' : 'No existe';"

# 2. Si existe, eliminar la migración
rm database/migrations/YYYY_MM_DD_HHMMSS_create_nombre_tabla_table.php

# 3. O marcarla como ejecutada sin correrla (avanzado)
php artisan migrate --pretend
```

### Error: "Table 'database.sessions' doesn't exist"

**Causa:** Falta la tabla de sesiones de Laravel.

**Solución:** Ya está resuelta. La migración `2026_01_18_141838_create_sessions_table.php` la crea.

### Error: "Nothing to migrate"

**Causa:** Todas las migraciones están ejecutadas.

**Solución:** Esto es correcto, no hay problema.

## Proceso de Resolución Aplicado

### Problema Original

```bash
SQLSTATE[42S02]: Base table or view not found: 1146 Table 'cyhfilament.sessions' doesn't exist
```

### Análisis

1. ✅ Base de datos `cyhfilament` existía con 53 tablas
2. ✅ Modelos copiados correctamente (38 archivos)
3. ❌ Migraciones NO copiadas del proyecto CYH
4. ❌ Laravel 12 creó migraciones por defecto que ya existían
5. ❌ Faltaba tabla `sessions`

### Solución Implementada

```bash
# 1. Copiar migraciones del proyecto CYH
cp /cyhfil/database/migrations/*.php /heavy-api/database/migrations/

# 2. Crear migración de sessions
php artisan make:migration create_sessions_table

# 3. Eliminar migraciones duplicadas
rm 0001_01_01_000000_create_users_table.php
rm 0001_01_01_000001_create_cache_table.php
rm 0001_01_01_000002_create_jobs_table.php
rm 2026_01_18_125541_create_permission_tables.php
rm 2026_01_18_125542_create_personal_access_tokens_table.php

# 4. Ejecutar migración de sessions
php artisan migrate
```

### Resultado

✅ **Problema resuelto** - Sistema funcionando correctamente con BD existente

## Conclusión

Este proyecto utiliza una **base de datos existente** (`cyhfilament`) que ya contiene todas las tablas necesarias. Las migraciones se mantienen para:

1. **Documentación** - Saber cómo se creó la estructura
2. **Control de versiones** - Trackear cambios en el esquema
3. **Nuevos cambios** - Aplicar modificaciones futuras

**Regla de oro:** Si la tabla existe, NO la migres. Si necesitas cambios, crea una nueva migración de alteración.

---

**Última actualización:** 18 de Enero, 2026  
**Estado:** ✅ Sistema funcionando correctamente  
**BD:** cyhfilament (53 tablas activas)  
**Migraciones:** 9 activas, todas ejecutadas
