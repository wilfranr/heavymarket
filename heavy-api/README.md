# Heavy API - Backend Laravel 13

Backend API REST para el sistema HeavyMarket construido con Laravel 13.

## Tecnologías Instaladas

- **Laravel 13.7.0** - Framework PHP
- **PHP 8.4.20** - Lenguaje de programación
- **Laravel Sanctum 4.3** - Autenticación API con tokens
- **Spatie Laravel Permission 6.25** - Sistema de roles y permisos
- **Laravel Excel 3.1** - Importación y exportación de Excel
- **DomPDF 3.1** - Generación de PDFs
- **Pusher 7.2** - WebSockets para chat en tiempo real
- **Pest 4.6** - Framework de testing (por defecto en Laravel 13)

## Estructura del Proyecto

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/
│   │       └── V1/          # Controladores API versionados
│   ├── Requests/             # Form Requests (validación)
│   ├── Resources/            # API Resources (transformadores)
│   └── Middleware/           # Middlewares personalizados
├── Models/                   # Modelos Eloquent (a migrar desde CYH)
├── Services/                 # Lógica de negocio
├── Repositories/             # Repositorios (opcional)
├── Events/                   # Eventos del sistema
└── Observers/                # Observers de modelos
```

## Configuración

### Base de Datos

El proyecto está configurado para usar MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=heavymarket
DB_USERNAME=root
DB_PASSWORD=secret
```

### Instalación

```bash
# Instalar dependencias
composer install

# Configurar base de datos
# Crear base de datos 'heavymarket' en MySQL

# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders (cuando estén disponibles)
php artisan db:seed
```

### Iniciar Servidor de Desarrollo

```bash
php artisan serve
# El servidor estará disponible en http://localhost:8000
```

## Próximos Pasos

1. Copiar modelos desde proyecto CYH (38 modelos)
2. Copiar migraciones desde proyecto CYH
3. Copiar seeders desde proyecto CYH
4. Crear controladores API para cada recurso
5. Implementar API Resources
6. Crear Form Requests para validación
7. Implementar servicios de negocio
8. Configurar rutas API

## API Endpoints (Planificado)

```
GET    /api/v1/pedidos
POST   /api/v1/pedidos
GET    /api/v1/pedidos/{id}
PUT    /api/v1/pedidos/{id}
DELETE /api/v1/pedidos/{id}

... (similar para todos los recursos)
```

### Pedidos: imágenes por ítem (referencias) y cola

Las respuestas **201** (`POST /api/v1/pedidos`) y **200** (`PUT /api/v1/pedidos/{id}`) con archivos (`referencias[n][imagenes]` al crear, `referencias[n][imagenes_nuevas]` al actualizar) pueden devolver el recurso **antes** de que existan filas en `pedido_referencia_imagen`: los archivos se guardan en disco en la petición y el registro en base de datos lo hace el job en cola `App\Jobs\SyncPedidoImages`.

- Es **consistencia eventual**: los clientes deben aceptar que `referencias[].imagenes` puede llegar vacío en el JSON inmediato y poblarse tras un `GET` posterior, una vez el worker procese la cola (`php artisan queue:work` o `QUEUE_CONNECTION=database`/`redis` según `.env`).
- No altera la lógica de **TRM** ni **fletes** (`PedidoService::calcularValores`), que solo aplica a proveedores de referencia.

## Testing

El proyecto usa **Pest v4** como framework de testing (por defecto en Laravel 13).

```bash
# Ejecutar todos los tests
composer test

# Ejecutar tests con Pest directamente
./vendor/bin/pest

# Ejecutar tests específicos
./vendor/bin/pest --filter="PedidoTest"

# Ejecutar tests con coverage
./vendor/bin/pest --coverage
```

### Estructura de Tests

```
tests/
├── Pest.php                    # Configuración global y helpers
├── Feature/
│   └── Api/                    # Tests de endpoints API
├── Unit/
│   ├── Enums/                  # Tests de enums (PedidoEstado)
│   ├── Traits/                 # Tests de traits (TransicionesEstado)
│   ├── Policies/               # Tests de policies (PedidoPolicy)
│   ├── Services/               # Tests de services
│   └── Http/Resources/         # Tests de API Resources
```

### Helpers Disponibles (tests/Pest.php)

- `seedRoles()` - Crea roles necesarios para tests
- `seedPermissions()` - Crea permisos básicos
- `createUserWithRole($role)` - Crea usuario con rol asignado
- `expectDatabaseHas($table, $data)` - Assert de existencia en BD
- `expectDatabaseMissing($table, $data)` - Assert de ausencia en BD
- `expectDatabaseCount($table, $count)` - Assert de cantidad de registros

## Linting y Formato

```bash
# Formatear código con Laravel Pint
./vendor/bin/pint

# Ver cambios sin aplicar
./vendor/bin/pint --test
```

## Comandos Útiles

```bash
# Ver rutas registradas
php artisan route:list

# Limpiar cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Crear controlador API
php artisan make:controller Api/V1/PedidoController --api

# Crear modelo con migración
php artisan make:model Pedido -m

# Crear API Resource
php artisan make:resource PedidoResource

# Crear Form Request
php artisan make:request StorePedidoRequest
```

## Documentación

- [Laravel 13 Documentation](https://laravel.com/docs/13.x)
- [Laravel Sanctum](https://laravel.com/docs/13.x/sanctum)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)
- [Laravel Excel](https://docs.laravel-excel.com)
- [DomPDF](https://github.com/barryvdh/laravel-dompdf)
- [Pest Documentation](https://pestphp.com/docs)

## Licencia

MIT
