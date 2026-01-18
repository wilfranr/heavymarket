# Backend API - HeavyMarket (Laravel 12)

Guía de contexto y convenciones para el desarrollo del backend API de HeavyMarket.

---

## 📋 Contexto del Proyecto

**HeavyMarket** es la migración del sistema CYH (Laravel 10 + Filament 3) a una arquitectura moderna de API REST.

- **Proyecto Original**: CYH - Laravel 10 + Filament 3 (monolítico)
- **Proyecto Nuevo**: HeavyMarket - API REST con Laravel 12
- **Base de Datos**: BD existente `cyhfilament` (53 tablas, 30.08 MB)
- **Objetivo**: Réplica exacta de funcionalidades como API REST

---

## 🎯 Stack Tecnológico

### Core
- **Laravel**: 12.47.0
- **PHP**: 8.4.11
- **Base de Datos**: MySQL 8.4.7

### Dependencias Principales
- **Laravel Sanctum 4.2**: Autenticación API con tokens
- **Spatie Permission 6.24**: Roles y permisos (6 roles)
- **Laravel Excel 3.1**: Import/Export de Excel
- **DomPDF 3.1**: Generación de PDFs
- **Pusher 7.2**: WebSockets para chat en tiempo real

### Base de Datos (Existente)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cyhfilament
DB_USERNAME=cyhfilament_user
DB_PASSWORD=cyhfilament_2025
```

- **53 tablas existentes** del proyecto CYH
- **38 modelos Eloquent** a migrar
- **30.08 MB** de datos (incluyendo 25MB de datos geográficos)

---

## 🏗 Arquitectura

### Patrón: API REST con Service Layer

```
Cliente (Angular) → API Controller → Service → Model → Database
                         ↓
                    API Resource
                    (Transformador)
```

### Estructura de Directorios

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/V1/           # Controladores API versionados
│   ├── Requests/              # Validación (FormRequests)
│   ├── Resources/             # Transformadores de respuestas
│   └── Middleware/            # Middlewares personalizados
├── Models/                    # 38 modelos Eloquent (migrar desde CYH)
├── Services/                  # Lógica de negocio
├── Repositories/              # Abstracción de datos (opcional)
├── Events/                    # Eventos del sistema
└── Observers/                 # Observers de modelos
```

---

## 📝 Convenciones de Código

### Tipado Estricto (PHP 8.4)

**Siempre usar:**
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\StorePedidoRequest;
use App\Http\Resources\PedidoResource;
use App\Services\PedidoService;
use Illuminate\Http\JsonResponse;

class PedidoController extends Controller
{
    public function __construct(
        private readonly PedidoService $pedidoService,
    ) {}

    public function store(StorePedidoRequest $request): JsonResponse
    {
        $pedido = $this->pedidoService->crearPedido($request->validated());
        
        return response()->json([
            'data' => new PedidoResource($pedido),
            'message' => 'Pedido creado exitosamente',
        ], 201);
    }
}
```

### Constructor Promotion

```php
// ✅ Correcto
public function __construct(
    private readonly UserRepository $users,
    private readonly Logger $logger,
) {}

// ❌ Incorrecto
private UserRepository $users;
public function __construct(UserRepository $users) {
    $this->users = $users;
}
```

### Nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Variables | camelCase | `$pedidoActual`, `$esActivo` |
| Métodos | camelCase | `crearPedido()`, `calcularTotal()` |
| Clases | PascalCase | `PedidoController`, `PedidoService` |
| Tablas DB | snake_case plural | `pedidos`, `orden_compras` |
| Columnas DB | snake_case | `fecha_creacion`, `es_activo` |
| Rutas API | kebab-case | `/api/v1/ordenes-compra` |

---

## 🚀 Responsabilidades por Capa

### Controladores (Controllers/Api/V1/)
- ✅ Recibir requests HTTP
- ✅ Validar con FormRequests
- ✅ Llamar a Services
- ✅ Retornar responses con API Resources
- ❌ NO lógica de negocio
- ❌ NO queries directas a BD

### Services (Services/)
- ✅ Lógica de negocio compleja
- ✅ Transacciones de BD
- ✅ Coordinación entre múltiples modelos
- ✅ Lanzar eventos
- Ejemplo: `PedidoService`, `CalculoPreciosService`

### API Resources (Http/Resources/)
- ✅ Transformar modelos a JSON
- ✅ Incluir relaciones condicionales
- ✅ Formatear datos
- Ejemplo: `PedidoResource`, `TerceroResource`

### Form Requests (Http/Requests/)
- ✅ Validación de entrada
- ✅ Autorización básica
- Nombrar: `Store{Model}Request`, `Update{Model}Request`

### Modelos (Models/)
- ✅ Relaciones Eloquent
- ✅ Scopes
- ✅ Mutadores/Accessors
- ✅ Casts
- ❌ NO lógica de negocio compleja

---

## 🔌 API REST - Convenciones

### Estructura de Rutas

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('pedidos', PedidoController::class);
        Route::apiResource('cotizaciones', CotizacionController::class);
        Route::apiResource('ordenes-compra', OrdenCompraController::class);
        Route::apiResource('ordenes-trabajo', OrdenTrabajoController::class);
        Route::apiResource('terceros', TerceroController::class);
        // ... más recursos
    });
});
```

### Respuestas JSON Estándar

**Éxito:**
```json
{
    "data": { /* recurso o colección */ },
    "message": "Operación exitosa",
    "meta": { /* paginación si aplica */ }
}
```

**Error:**
```json
{
    "message": "Mensaje de error",
    "errors": { /* validación si aplica */ }
}
```

### HTTP Status Codes

- `200 OK`: GET exitoso
- `201 Created`: POST exitoso
- `204 No Content`: DELETE exitoso
- `400 Bad Request`: Error de validación
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Sin permisos
- `404 Not Found`: Recurso no encontrado
- `422 Unprocessable Entity`: Error de validación (Laravel)
- `500 Server Error`: Error interno

---

## 🔐 Autenticación y Autorización

### Laravel Sanctum

```php
// Proteger rutas
Route::middleware('auth:sanctum')->group(function () {
    // rutas protegidas
});

// En controladores
if (! $request->user()->can('create', Pedido::class)) {
    return response()->json(['message' => 'No autorizado'], 403);
}
```

### Roles del Sistema (Spatie Permission)

1. `super_admin` - Acceso completo
2. `Administrador` - Gestión general
3. `Vendedor` - Pedidos y cotizaciones
4. `Analista` - Reportes y análisis
5. `Logistica` - Órdenes de compra/trabajo
6. `panel_user` - Usuario básico

---

## 🧪 Testing

### Comando
```bash
php artisan test
```

### Estructura de Tests

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\{Pedido, User};

class PedidoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_puede_listar_pedidos(): void
    {
        $user = User::factory()->create();
        Pedido::factory()->count(5)->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/v1/pedidos');

        $response->assertOk()
                 ->assertJsonCount(5, 'data');
    }
}
```

---

## 📦 Módulos del Sistema (Migrar desde CYH)

1. **Pedidos** - Gestión con referencias y proveedores
2. **Cotizaciones** - Generación con cálculos automáticos
3. **Órdenes de Compra** - Agrupación por proveedor
4. **Órdenes de Trabajo** - Tracking de trabajos
5. **Terceros** - Clientes/proveedores/contactos
6. **Artículos y Referencias** - Catálogo de productos
7. **Fabricantes y Sistemas** - Catálogos
8. **Usuarios y Roles** - Gestión de accesos
9. **Chat** - Tiempo real con Pusher
10. **PDFs** - Generación de documentos
11. **Importación Excel** - Carga masiva
12. **Cálculos** - Precios nacional/internacional

---

## ⚡ Comandos Útiles

```bash
# Servidor de desarrollo
php artisan serve                              # Puerto 8000

# Base de datos
php artisan db:show                            # Ver info de BD
php artisan migrate                            # Ejecutar migraciones
php artisan db:seed                            # Ejecutar seeders

# Generadores
php artisan make:controller Api/V1/PedidoController --api
php artisan make:model Pedido
php artisan make:resource PedidoResource
php artisan make:request StorePedidoRequest

# Testing
php artisan test                               # Ejecutar tests
php artisan test --coverage                    # Con cobertura

# Código
./vendor/bin/pint                              # Formatear código
php artisan route:list                         # Ver rutas
php artisan route:list --path=api              # Solo rutas API

# Cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

---

## ✅ Do's

- ✅ Usar `declare(strict_types=1);` en todos los archivos
- ✅ Usar constructor promotion para DI
- ✅ Validar con FormRequests
- ✅ Transformar con API Resources
- ✅ Lógica de negocio en Services
- ✅ Usar eager loading (`with()`)
- ✅ Implementar autorización con Policies
- ✅ Escribir tests para nuevas features
- ✅ Documentar métodos públicos complejos
- ✅ Usar `./vendor/bin/pint` para formatear
- ✅ Seguir PSR-12

## ❌ Don'ts

- ❌ Lógica de negocio en controladores
- ❌ Queries directas en controladores
- ❌ Usar `$_POST`, `$_GET` directamente
- ❌ Hardcodear configuraciones
- ❌ Commitear `.env` o credenciales
- ❌ Usar `dd()` en producción
- ❌ Modificar archivos en `/vendor`
- ❌ Ignorar validaciones
- ❌ Exponer datos sensibles en API
- ❌ Violar principio de responsabilidad única

---

## 🎯 Próximos Pasos de Migración

1. ✅ Setup de Laravel 12 con dependencias
2. ⏳ Copiar 38 modelos desde CYH
3. ⏳ Adaptar modelos (eliminar dependencias Filament)
4. ⏳ Crear controladores API por recurso
5. ⏳ Crear API Resources
6. ⏳ Crear Form Requests
7. ⏳ Implementar Services
8. ⏳ Configurar rutas API
9. ⏳ Testing endpoints
10. ⏳ Documentar API (OpenAPI/Swagger)

---

**Nota para IA**: Antes de sugerir cambios, verificar:
- `composer.json` para dependencias instaladas
- Base de datos `cyhfilament` con 53 tablas existentes
- Proyecto CYH en `/home/yoseth/Dev/cyhfil/` como referencia
- Mantener compatibilidad con frontend Angular 20

**Versión**: 1.0.0  
**Última actualización**: Enero 18, 2026  
**Stack**: Laravel 12.47.0 + PHP 8.4.11 + MySQL 8.4.7
