# HeavyMarket

Sistema de gestión comercial moderno construido con Laravel 12 y Angular 20.

## Descripción

HeavyMarket es la evolución del sistema CYH, migrado a una arquitectura moderna de API REST con backend Laravel y frontend Angular usando el template Sakai con PrimeNG.

## Estructura del Proyecto

```
heavymarket/
├── heavy-api/          Backend API REST con Laravel 12
├── heavy-front/        Frontend SPA con Angular 20 + PrimeNG (Sakai)
└── docker-compose.yml  Orquestación de servicios para desarrollo
```

## Tecnologías

### Backend (heavy-api)
- Laravel 12 (o Laravel 11)
- PHP 8.2+
- MySQL 8.0+
- Laravel Sanctum (autenticación API)
- Spatie Laravel Permission (roles y permisos)
- DomPDF (generación de PDFs)
- Laravel Excel (importación/exportación)
- Pusher (WebSockets para chat en tiempo real)

### Frontend (heavy-front)
- Angular 20
- PrimeNG 20 (UI components)
- Tailwind CSS
- NgRx (gestión de estado)
- Chart.js (gráficos)
- Pusher JS (chat en tiempo real)

## Requisitos

- PHP 8.2 o superior
- Composer 2.x
- Node.js 20.x o superior
- npm 10.x o superior
- MySQL 8.0 o superior
- Git

## Instalación

### Backend

```bash
cd heavy-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Ver documentación completa en [heavy-api/README.md](heavy-api/README.md)

### Frontend

```bash
cd heavy-front
npm install
npm start
```

El frontend estará disponible en `http://localhost:4200`

Ver documentación completa en [heavy-front/README.md](heavy-front/README.md)

## Desarrollo con Docker

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## Funcionalidades Principales

- Gestión de Pedidos
- Cotizaciones
- Órdenes de Compra
- Órdenes de Trabajo
- Gestión de Terceros (Clientes/Proveedores)
- Catálogo de Artículos y Referencias
- Sistema de Roles y Permisos
- Chat en Tiempo Real
- Generación de PDFs
- Importación de Excel
- Cálculos Automáticos de Precios
- Gestión de TRM y Fletes

## Módulos del Sistema

- **Pedidos**: Gestión completa de pedidos con referencias y proveedores
- **Cotizaciones**: Generación de cotizaciones con cálculos automáticos
- **Órdenes de Compra**: Agrupación por proveedor y gestión de referencias
- **Órdenes de Trabajo**: Seguimiento de trabajos internos
- **Terceros**: Gestión de clientes, proveedores y contactos
- **Artículos**: Catálogo de productos con stock y clasificación
- **Referencias**: Gestión de referencias con fabricantes y sistemas
- **Usuarios**: Administración de usuarios, roles y permisos

## Sistema de Roles

- **Super Admin**: Acceso completo al sistema
- **Administrador**: Gestión general y configuración
- **Vendedor**: Pedidos, cotizaciones y clientes
- **Analista**: Reportes y análisis de datos
- **Logística**: Órdenes de compra y trabajo

## Scripts Útiles

```bash
# Backend
cd heavy-api
php artisan test              # Ejecutar tests
php artisan pint              # Formatear código
php artisan route:list        # Ver rutas API

# Frontend
cd heavy-front
npm test                      # Ejecutar tests
npm run build                 # Build de producción
npm run lint                  # Linter
npm run format                # Formatear código
```

## Documentación

- [Documentación del Backend](heavy-api/README.md)
- [Documentación del Frontend](heavy-front/README.md)
- [Guía de Desarrollo](docs/DEVELOPMENT.md)
- [Guía de Deployment](docs/DEPLOYMENT.md)
- [API Documentation](docs/API.md)

## Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

MIT License

## Contacto

Proyecto HeavyMarket - Sistema de Gestión Comercial

---

**Migrado desde**: Sistema CYH (Laravel 10 + Filament 3)  
**Versión**: 1.0.0  
**Fecha de Inicio**: Enero 2026
