# Heavy API - Backend Laravel 12

Backend API REST para el sistema HeavyMarket construido con Laravel 12.47.0.

## Tecnologías Instaladas

- **Laravel 12.47.0** - Framework PHP
- **PHP 8.4.11** - Lenguaje de programación
- **Laravel Sanctum 4.2** - Autenticación API con tokens
- **Spatie Laravel Permission 6.24** - Sistema de roles y permisos
- **Laravel Excel 3.1** - Importación y exportación de Excel
- **DomPDF 3.1** - Generación de PDFs
- **Pusher 7.2** - WebSockets para chat en tiempo real

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

## Testing

```bash
# Ejecutar tests
php artisan test

# Ejecutar tests con coverage
php artisan test --coverage
```

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

- [Laravel 12 Documentation](https://laravel.com/docs/12.x)
- [Laravel Sanctum](https://laravel.com/docs/12.x/sanctum)
- [Spatie Permission](https://spatie.be/docs/laravel-permission)
- [Laravel Excel](https://docs.laravel-excel.com)
- [DomPDF](https://github.com/barryvdh/laravel-dompdf)

## Licencia

MIT
