# Heavy API - Backend Laravel

Backend API REST para el sistema HeavyMarket.

## Estado Actual

Esta carpeta está preparada para recibir el proyecto Laravel 12. El backend será creado en los próximos pasos de la migración.

## Próximos Pasos

1. Crear proyecto Laravel 12 (o Laravel 11)
2. Instalar dependencias (Sanctum, Spatie Permission, etc)
3. Migrar modelos desde proyecto CYH
4. Crear endpoints REST API
5. Implementar autenticación y autorización

## Estructura Planificada

```
heavy-api/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   ├── Requests/
│   │   ├── Resources/
│   │   └── Middleware/
│   ├── Models/          # 38 modelos a migrar
│   ├── Services/        # Lógica de negocio
│   ├── Events/
│   └── Observers/
├── database/
│   ├── migrations/      # Copiar desde CYH
│   └── seeders/
├── routes/
│   └── api.php          # Rutas API REST
└── tests/
```

## Tecnologías

- Laravel 12 (o 11)
- PHP 8.2+
- MySQL 8.0+
- Laravel Sanctum (auth API)
- Spatie Laravel Permission (roles/permisos)
- DomPDF (PDFs)
- Laravel Excel (importación)
- Pusher (WebSockets)

## Instalación (cuando esté creado)

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

## Documentación

Ver documentación completa del proyecto en el [README principal](../README.md).
