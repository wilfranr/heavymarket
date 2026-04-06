# 🧪 Estándar de Testing - HeavyMarket

> **Objetivo**: Establecer prácticas de testing consistentes para todos los agentes.  
> **Aplicado a**: Laravel API (`heavy-api`), Angular Frontend (`heavy-front`)

---

## 1. Principios Fundamentales

### 1.1 Todo Feature = Test
**REGLA DE ORO**: Ninguna funcionalidad nueva se considera completa sin tests asociados.

```
[new feature] → [test unitario] → [test integración] → [commit]
```

### 1.2 Pirámide de Testing

```
        /\
       /  \      E2E (Playwright) - Mínimos, solo flujos críticos
      /----\
     /      \   Integración/Feature - Cada endpoint CRUD
    /--------\
   /          \ Unitarios - Servicios, Models, Resources, FormRequests
  /____________\
```

### 13 Nomenclatura de Tests

| Tipo | Nombre del archivo | Descripción |
|------|-------------------|-------------|
| Unitario | `tests/Unit/Services/PedidoServiceTest.php` | Lógica de negocio pura |
| Resource | `tests/Unit/Http/Resources/MaquinaResourceTest.php` | Transformación de datos |
| Feature | `tests/Feature/Api/MaquinaControllerTest.php` | Endpoints HTTP |

---

## 2. Estructura de Tests

### 2.1 Tests Unitarios

```php
<?php
// tests/Unit/Services/PedidoServiceTest.php
namespace Tests\Unit\Services;

use App\Services\PedidoService;
use Tests\TestCase;

class PedidoServiceTest extends TestCase
{
    public function test_calcular_valores_nacionales_exitoso(): void
    {
        // Arrange: preparar datos
        // Act: ejecutar acción
        // Assert: verificar resultado
    }
}
```

### 2.2 Tests Feature/API

```php
<?php
// tests/Feature/Api/MaquinaControllerTest.php
namespace Tests\Feature\Api;

use App\Models\{User, Maquina, Lista};
use Illuminate\Foundation\Testing\RefreshDatabase;

class MaquinaControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->user->assignRole('Administrador');
    }

    public function test_puede_crear_maquina(): void
    {
        // Given: datos de entrada
        // When: petición HTTP
        // Then: respuesta y estado de BD
    }
}
```

---

## 3. Factories - Requisito Crítico

### 3.1 Reglas para Factories

1. **Siempre actualizar** cuando se cambia el schema de la tabla
2. **No usar tablas obsoletas** (ej: `fabricantes` → `listas`)
3. **Definir estados** para casos especiales (`es_temporal`, `aprobado`, etc.)

### 3.2 Ejemplo de Factory Actualizada

```php
<?php
// database/factories/MaquinaFactory.php
namespace Database\Factories;

use App\Models\{Maquina, Lista};
use Illuminate\Database\Eloquent\Factories\Factory;

class MaquinaFactory extends Factory
{
    protected $model = Maquina::class;

    public function definition(): array
    {
        return [
            'tipo' => Lista::factory()->tipoMaquina(),
            'modelo' => fake()->word() . ' ' . fake()->randomNumber(3),
            'fabricante_id' => Lista::factory()->fabricante(),
            'serie' => fake()->unique()->uuid(),
            'arreglo' => fake()->optional()->sentence(),
            'estado_revision' => 'por_revisar',
        ];
    }

    public function revisada(): static
    {
        return $this->state(fn (array $attributes) => [
            'estado_revision' => 'revisado',
        ]);
    }
}
```

---

## 4. Running Tests

### Comandos Estándar

```bash
# Unitarios únicamente
php artisan test --filter=Unit

# Feature únicamente
php artisan test --filter=Feature

# Un archivo específico
php artisan test tests/Unit/Services/PedidoServiceTest.php

# Con coverage (si está configurado)
php artisan test --coverage
```

### Verificación Pre-Commit

```bash
# Antes de hacer commit, ejecutar:
php artisan test --filter=Unit
```

---

## 5. Checklist para Agentes

- [ ] ¿Creaste la factory del modelo antes de escribir tests?
- [ ] ¿El test usa datos de factories, no hardcodeados?
- [ ] ¿El test unitario prueba un método específico del servicio?
- [ ] ¿El test feature prueba un endpoint completo?
- [ ] ¿Usaste `RefreshDatabase` en tests de API?
- [ ] ¿Verificaste que los tests pasan antes de hacer commit?

---

## 6. Modelos con Factories Obligatorias

| Modelo | Factory | Prioridad |
|--------|---------|-----------|
| User | ✅ existe | - |
| Tercero | ✅ existe | - |
| Pedido | ✅ existe | - |
| Maquina | ✅ creada | Alta |
| Lista | ✅ creada | Alta |
| Referencia | ✅ creada | Alta |
| Contacto | ✅ creada | Media |
| Articulo | ❌ falta | Media |
| Sistema | ❌ falta | Baja |

---

## 7. Errores Comunes a Evitar

| Error | Solución |
|-------|----------|
| Test falla por datos obsoletos | Actualizar factories antes de ejecutar tests |
| "Table not found" | Usar `RefreshDatabase` y verificar migrations |
| N+1 queries en tests | Usar factories con relaciones cargadas (`with()`) |
| Test demasiado耦合 | Un test = una assertion principal |
| Migration que altera tabla inexistente | **SIEMPRE** verificar que la tabla exista antes de ALTER TABLE. Si no existe, crear con `Schema::create` primero |

### 7.1 Migraciones con ALTER TABLE

**REGLA CRÍTICA**: Si una migración usa `alter table`, debe verificar que la tabla ya exista.

```php
// ✅ CORRECTO: Verificar antes de alterar
public function up(): void
{
    if (!Schema::hasTable('listas')) {
        Schema::create('listas', function (Blueprint $table) {
            $table->id();
            $table->string('tipo');
            $table->string('nombre');
            // ... campos base
        });
    }
    
    // Luego sí alterar
    Schema::table('listas', function (Blueprint $table) {
        $table->unsignedBigInteger('parent_id')->nullable();
    });
}

// ❌ INCORRECTO: Asumir que la tabla existe
public function up(): void
{
    Schema::table('listas', function (Blueprint $table) {
        $table->unsignedBigInteger('parent_id')->nullable();
    }); // Falla si la tabla no existe
}
```

---

## 8. Referencias

- [Laravel Testing](https://laravel.com/docs/12.x/testing)
- [Pest PHP](https://pestphp.com) - Alternativa moderna a PHPUnit
- [Engram - Memoria Persistente](./SINC_MEMORIA.md)
