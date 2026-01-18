# Heavy Front - Frontend Angular 20

Frontend SPA para el sistema HeavyMarket construido con Angular 20 y PrimeNG 20 (template Sakai).

## Tecnologías Instaladas

- **Angular 20.3.16** - Framework frontend
- **PrimeNG 20** - Librería de componentes UI
- **Tailwind CSS 4.1** - Framework CSS utility-first
- **Chart.js 4.4** - Librería de gráficos
- **NgRx 18** - Gestión de estado (Store, Effects, Entity, DevTools)
- **Pusher JS 8** - WebSockets para chat en tiempo real
- **XLSX 0.18** - Manejo de archivos Excel

## Estructura del Proyecto (Sakai Base)

```
src/app/
├── layout/              # Layout principal (sidebar, topbar, footer)
│   ├── component/
│   └── service/
├── pages/               # Páginas base de Sakai
│   ├── auth/           # Login, access, error
│   ├── dashboard/      # Dashboard con widgets
│   ├── crud/           # Ejemplo de CRUD
│   ├── landing/        # Landing page
│   ├── service/        # Servicios de ejemplo
│   └── uikit/          # Ejemplos de componentes UI
└── app.routes.ts       # Configuración de rutas
```

## Estructura a Agregar (HeavyMarket)

```
src/app/
├── core/                # NUEVO - Funcionalidad core
│   ├── auth/
│   │   ├── services/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── models/
│   ├── services/
│   └── models/
├── features/            # NUEVO - Módulos de negocio
│   ├── pedidos/
│   ├── cotizaciones/
│   ├── ordenes-compra/
│   ├── ordenes-trabajo/
│   ├── terceros/
│   ├── articulos/
│   └── referencias/
├── shared/              # NUEVO - Componentes compartidos
│   ├── components/
│   ├── directives/
│   └── pipes/
└── store/               # NUEVO - NgRx store
    ├── actions/
    ├── reducers/
    ├── effects/
    └── selectors/
```

## Configuración de Entornos

### Desarrollo (`environment.ts`)
```typescript
apiUrl: 'http://localhost:8000/api/v1'
apiBaseUrl: 'http://localhost:8000'
```

### Producción (`environment.prod.ts`)
```typescript
apiUrl: 'https://api.heavymarket.com/api/v1'
apiBaseUrl: 'https://api.heavymarket.com'
```

## Instalación y Ejecución

### Instalar Dependencias
```bash
npm install
```

### Iniciar Servidor de Desarrollo
```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

### Build de Producción
```bash
npm run build
# o
ng build --configuration=production
```

Los archivos compilados estarán en `dist/`

## Comandos Útiles

```bash
# Ejecutar tests
npm test

# Ejecutar linter
npm run lint

# Formatear código
npm run format

# Generar componente
ng generate component features/pedidos/pedido-list

# Generar servicio
ng generate service core/services/api

# Generar guard
ng generate guard core/guards/auth

# Generar interceptor
ng generate interceptor core/interceptors/auth
```

## Componentes Disponibles (PrimeNG)

El template Sakai incluye ejemplos de uso de todos los componentes de PrimeNG:

- **Tables**: DataTable con filtros, paginación, ordenamiento
- **Forms**: Input, Dropdown, Calendar, FileUpload, etc.
- **Buttons**: Button, SplitButton, SpeedDial
- **Overlays**: Dialog, Sidebar, Toast
- **Charts**: Line, Bar, Pie, Doughnut
- **Navigation**: Menu, Breadcrumb, Steps
- **Misc**: ProgressBar, Badge, Chip, Tag

Ver ejemplos en `src/app/pages/uikit/`

## Características de Sakai

### Layout Responsive
- Sidebar colapsable
- Topbar con búsqueda y notificaciones
- Footer personalizable
- Soporte para modo claro/oscuro

### Temas
El sistema incluye múltiples temas pre-configurados de PrimeNG:
- Lara (Light/Dark)
- Aura (Light/Dark)
- Material (Light/Dark)

Cambiar tema en `app.component.ts`

### Routing
- Lazy loading de módulos
- Guards de autenticación
- Rutas protegidas

## Integración con Backend

### Configurar HttpClient
Ya está configurado en `app.config.ts` con `provideHttpClient()`

### Crear Interceptor de Autenticación
```typescript
// src/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }
    return next(req);
};
```

### Configurar en app.config.ts
```typescript
export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(
            withInterceptors([authInterceptor])
        ),
        // ... otros providers
    ]
};
```

## Próximos Pasos

1. Crear estructura de carpetas (core, features, shared, store)
2. Implementar servicio de autenticación
3. Crear interceptores (auth, error)
4. Implementar guards de rutas
5. Crear módulos de features
6. Implementar NgRx store
7. Conectar con API Laravel
8. Personalizar branding (logo, colores, nombre)

## Documentación

- [Angular 20 Documentation](https://angular.dev/)
- [PrimeNG Documentation](https://primeng.org/)
- [Sakai Template](https://github.com/primefaces/sakai-ng)
- [NgRx Documentation](https://ngrx.io/)
- [Tailwind CSS](https://tailwindcss.com/)

## Licencia

MIT
