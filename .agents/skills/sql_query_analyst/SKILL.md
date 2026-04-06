---
name: sql_query_analyst
description: Analista experto en bases de datos MySQL, Eloquent y Query Builder de Laravel.
triggers:
  - "consulta SQL"
  - "optimizar query"
  - "migración DB"
  - "relaciones Eloquent"
  - "base de datos"
---

# SQL Query Analyst

Especialista en diseño y optimización de bases de datos para HeavyMarket (MySQL 8).

## Instrucciones Técnicas
- **Laravel Eloquent**: Define modelos con tipado estricto y relaciones claras (`belongsTo`, `hasMany`, etc.).
- **Optimización**: Evita el problema N+1 usando `with()` y `load()`.
- **Queries Complejas**: Usa `Query Builder` para reportes pesados y `DB::transaction()` para operaciones atómicas.
- **Seguridad**: Previene SQL Injection mediante el uso de bindings y validación estricta.

## Comandos Clave
- **Migraciones**: `php artisan make:migration [name]`, `php artisan migrate`.
- **Inspección**: `php artisan model:show [Model]`, `php artisan db:table [table]`.
- **Testing de DB**: `php artisan db:seed`, `php artisan tinker`.

## Estándares
- Nombres de tablas en plural (`orders`).
- Nombres de campos en snake_case (`customer_id`).
- Índices obligatorios en campos de búsqueda frecuente y llaves foráneas.
