# Contexto y Guía para Agentes de IA - HeavyMarket (Backend API)

> **IMPORTANTE**: Todas las interacciones, documentación y reportes de estado deben ser en **ESPAÑOL**. Ver `AGENTS.md` en la raíz para reglas completas.
>
> **Engram (MCP)**: En `mem_search`, `mem_save` y `mem_session_summary` usar siempre `project: "heavymarket"`. Ver sección *Memoria persistente (Engram MCP)* en el `AGENTS.md` de la raíz del repositorio.

## Stack Tecnológico
- **Framework**: Laravel 13.
- **Lenguaje**: PHP 8.4+ (Tipado estricto).
- **Base de Datos**: MySQL 8.
- **API**: RESTful.
- **Autenticación**: Laravel Sanctum.
- **Roles/Permisos**: Spatie Laravel Permission.
- **Testing**: Pest v4 (framework por defecto en Laravel 13).

## Arquitectura del Proyecto (`app/`)
El backend utiliza patrones de diseño para mantener los controladores limpios y la lógica desacoplada.

- **`Http/Controllers`**: Únicamente para recibir peticiones, validar (vía FormRequests) y retornar respuestas (vía Resources). NO contener lógica de negocio compleja.
- **`Services/`**: Contienen la lógica de negocio. Un controlador debe llamar a un servicio para ejecutar una acción.
- **`Repositories/`**: (Si aplica) Abstracción de la capa de datos. Usar para consultas complejas o reutilizables.
- **`Models/`**: Definición de Eloquent Models, relaciones y Scopes.
- **`Http/Requests`**: Validaciones de entrada. SIEMPRE usar FormRequests para operaciones de escritura (POST, PUT).
- **`Http/Resources`**: Transformación de datos de salida. SIEMPRE usar Resources para formatear la respuesta JSON.

## Mejores Prácticas y Reglas

### 1. Codificación PHP
- Seguir el estándar PSR-12.
- Usar **Tipado Estricto** (`declare(strict_types=1);` opcional pero recomendado, tipar argumentos y retornos).
- Usar las nuevas características de PHP 8.4 (Constructor promotion, Readonly classes, Enums) donde aporte claridad.

### 2. Diseño de API
- **Rutas**: Nombrar recursos en plural (`/api/orders`).
- **Verbos**: Usar correctamente GET, POST, PUT/PATCH, DELETE.
- **Respuestas**:
  - Exito: 200/201 con JSON estructurado.
  - Error: Códigos 4xx/5xx con mensajes claros.

### 3. Base de Datos
- Usar Migraciones para cualquier cambio de esquema.
- Usar Factories y Seeders para datos de prueba.
- Optimizar consultas (evitar N+1) usando `with()` (Eager Loading).

### 4. Seguridad
- Autorización: Usar Policies o Gates (integrado con Spatie) para verificar permisos antes de ejecutar acciones en el Controller o Service.
- Validación: Nunca confiar en el input del usuario.

### 5. Testing
- Framework: **Pest v4** (sintaxis funcional, preferido sobre PHPUnit).
- Escribir tests para nuevas funcionalidades (`composer test` o `./vendor/bin/pest`).
- Preferir Feature tests para endpoints de API.
- Tests Unitarios para traits, enums, policies y services.
- Usar helpers definidos en `tests/Pest.php`: `seedRoles()`, `createUserWithRole()`, `expectDatabaseHas()`, etc.
- Los tests Feature usan `RefreshDatabase` automáticamente vía configuración en `tests/Pest.php`.

## Comandos de Ayuda
- `php artisan serve`: Servidor local.
- `php artisan pint`: Formatear código automáticamente.
- `php artisan route:list`: Ver rutas disponibles.
- `php artisan model:show [Model]`: Ver detalles de un modelo.

## Troubleshooting de Producción
Para problemas con carga de imágenes o errores 404 en assets de storage, consultar la guía:
`docs/SOLUCION_IMAGENES_STORAGE.md`

