# Gestión de Migraciones - HeavyMarket API

## Situación del Proyecto

### Base de Datos Legacy (Origen CYH)
HeavyMarket es la evolución del sistema original **CYH (Laravel 10 + Filament 3)**. La base de datos `cyhfilament` fue adoptada y optimizada para la nueva arquitectura:
- **Motor:** MySQL 8.4+
- **Estado:** Estructura consolidada con soporte para operaciones comerciales complejas.
- **Dato Clave:** Se conservaron más de 50 tablas y sus datos de producción originales, adaptando los modelos a Laravel 13.

## Estructura de Migraciones (Sincronizada Mayo 2026)

El proyecto cuenta con un historial completo de migraciones que definen la evolución del esquema desde la base legacy hasta las funcionalidades actuales de Laravel 13.

### Principales Bloques de Migración:

1. **Consolidación (Agosto 2025):** Creación de tablas core, negocio y operaciones.
2. **Estandarización (Enero - Marzo 2026):** Listas con jerarquía, referencias temporales e identidades sociales.
3. **Módulos Avanzados (Abril - Mayo 2026):**
   - Gestión de TRM diaria.
   - Notificaciones In-App (Laravel Reverb).
   - Componentes de Máquina.
   - Flujo completo de Cotizaciones y Órdenes de Trabajo.
   - Asociación N:N de Sistemas y Tipos de Artículo.
   - Trazabilidad de origen de pedidos (Landing vs Admin).

## Tablas Principales del Sistema

| Módulo | Tablas Clave |
| :--- | :--- |
| **Core** | `users`, `roles`, `permissions`, `sessions`, `jobs`, `notifications` |
| **Catálogos** | `listas`, `sistemas`, `maquinas`, `fabricantes`, `trms` |
| **Geografía** | `countries`, `states`, `cities`, `direcciones` |
| **Inventario** | `articulos`, `referencias`, `articulo_juegos`, `medidas` |
| **Comercial** | `terceros`, `contactos`, `pedidos`, `cotizaciones` |
| **Operaciones** | `orden_compras`, `orden_trabajos`, `orden_trabajo_referencias` |
| **Pivots** | `sistema_lista`, `articulo_referencias`, `tercero_sistemas` |

## Comandos Críticos

### Ver estado real de la DB
```bash
php artisan db:show
```

### Ejecutar nuevas migraciones
```bash
php artisan migrate
```

### Crear cambio de esquema
```bash
php artisan make:migration add_field_to_table_table
```

## Reglas de Oro
- ❌ **PROHIBIDO** usar `migrate:fresh` en producción.
- ✅ Siempre verificar si una tabla existe en el legacy antes de crear una migración nueva.
- ✅ Los nombres de tablas deben seguir la convención de Eloquent (plural, snake_case), validando contra la lista actual para evitar duplicidad (ej. `orden_compras` vs `orden_compra`).

---

**Última actualización:** 17 de Mayo, 2026  
**Estado:** ✅ Base de Datos sincronizada con Laravel 13  
**BD:** cyhfilament (>60 tablas activas)
