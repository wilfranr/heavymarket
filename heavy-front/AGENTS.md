# Frontend SPA - HeavyMarket (Angular 20 + Sakai)

Guía de contexto y convenciones para el desarrollo del frontend de HeavyMarket.

---

## 📋 Contexto del Proyecto

**HeavyMarket** es la migración del sistema CYH a una arquitectura moderna SPA.

- **Proyecto Original**: CYH - Laravel 10 + Filament 3 (monolítico)
- **Proyecto Nuevo**: HeavyMarket - SPA con Angular 20
- **Template Base**: Sakai (PrimeNG oficial)
- **Backend**: Laravel 12 API REST en `http://localhost:8000`

---

## 🎯 Stack Tecnológico

### Core
- **Angular**: 20.3.16
- **TypeScript**: 5.8.3
- **Node.js**: 20.x
- **Template**: Sakai (PrimeNG)

### UI y Estilos
- **PrimeNG**: 20 (componentes UI completos)
- **PrimeIcons**: Librería de iconos (`pi pi-*`)
- **Tailwind CSS**: 4.1 (utility-first)
- **Chart.js**: 4.4 (gráficos)

### Estado y Datos
- **NgRx**: 18 (Store, Effects, Entity, DevTools)
- **RxJS**: 7.8 (Observables y operadores)

### Integraciones
- **Pusher JS**: 8 (WebSockets para chat)
- **XLSX**: 0.18 (manejo de Excel)

### Backend API
```typescript
// src/environments/environment.ts
apiUrl: 'http://localhost:8000/api/v1'
apiBaseUrl: 'http://localhost:8000'
```

---

## 🏗 Arquitectura

### Patrón: Feature-Based Architecture con NgRx

```
Component → Service → NgRx Store → API → Backend Laravel
              ↓
         Interceptor (Auth/Error)
```

### Estructura de Directorios

```
src/app/
├── layout/                    # Layout Sakai (sidebar, topbar, footer)
│   ├── component/
│   └── service/
├── pages/                     # Páginas base de Sakai
│   ├── auth/                  # Login, access, error
│   ├── dashboard/             # Dashboard con widgets
│   └── uikit/                 # Ejemplos de componentes
├── core/                      # NUEVO - Core de HeavyMarket
│   ├── auth/
│   │   ├── services/          # auth.service.ts
│   │   ├── guards/            # auth.guard.ts, role.guard.ts
│   │   ├── interceptors/      # auth.interceptor.ts
│   │   └── models/            # user.model.ts
│   ├── services/              # api.service.ts (base)
│   └── models/                # Interfaces y tipos
├── features/                  # NUEVO - Módulos de negocio
│   ├── pedidos/
│   ├── cotizaciones/
│   ├── ordenes-compra/
│   ├── ordenes-trabajo/
│   ├── terceros/
│   ├── articulos/
│   └── referencias/
├── shared/                    # NUEVO - Compartido
│   ├── components/            # Componentes reutilizables
│   ├── directives/            # Directivas personalizadas
│   ├── pipes/                 # Pipes personalizados
│   └── models/                # Interfaces compartidas
└── store/                     # NUEVO - NgRx store
    ├── actions/
    ├── reducers/
    ├── effects/
    └── selectors/
```

---

## 📝 Convenciones Angular 20

### 1. Standalone Components (Obligatorio)

```typescript
// ✅ Correcto - Standalone Component
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-pedido-list',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    templateUrl: './pedido-list.component.html',
    styleUrls: ['./pedido-list.component.scss']
})
export class PedidoListComponent {}

// ❌ Incorrecto - No crear NgModules
@NgModule({ ... })
export class PedidoModule {}
```

### 2. Signals (Prioridad sobre Observables)

```typescript
// ✅ Correcto - Usar Signals
import { Component, signal, computed } from '@angular/core';

export class PedidoListComponent {
    pedidos = signal<Pedido[]>([]);
    isLoading = signal(false);
    
    // Computed signal
    totalPedidos = computed(() => this.pedidos().length);
    
    // Input signal
    pedidoId = input<number>();
    
    // Output signal
    pedidoCreado = output<Pedido>();
}

// ❌ Evitar - BehaviorSubject (solo cuando sea necesario)
pedidos$ = new BehaviorSubject<Pedido[]>([]);
```

### 3. Control Flow Syntax (Nueva)

```typescript
<!-- ✅ Correcto - Nueva sintaxis @if, @for -->
<div>
    @if (isLoading()) {
        <p-progressSpinner />
    } @else {
        @for (pedido of pedidos(); track pedido.id) {
            <app-pedido-card [pedido]="pedido" />
        } @empty {
            <p>No hay pedidos</p>
        }
    }
</div>

<!-- ❌ Evitar - Sintaxis antigua -->
<div *ngIf="isLoading">...</div>
<div *ngFor="let item of items">...</div>
```

---

## 🎨 Sakai Template - Convenciones

### 1. Usar Componentes de PrimeNG

```typescript
// Siempre usar componentes de PrimeNG incluidos en Sakai
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
```

### 2. Iconos con PrimeIcons

```html
<!-- ✅ Correcto - Usar PrimeIcons -->
<p-button icon="pi pi-save" label="Guardar" />
<i class="pi pi-check"></i>

<!-- ❌ Evitar - Otras librerías de iconos -->
<mat-icon>save</mat-icon>
```

### 3. Respetar Layout de Sakai

```typescript
// No modificar estructura de layout/
// Personalizar solo:
// - Colores en variables SCSS
// - Logo en assets/
// - Menú en app.menu.component.ts
```

---

## 🔌 Integración con Backend

### Servicio Base para API

```typescript
// src/app/core/services/api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    get<T>(endpoint: string): Observable<T> {
        return this.http.get<T>(`${this.apiUrl}/${endpoint}`);
    }

    post<T>(endpoint: string, data: any): Observable<T> {
        return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data);
    }

    put<T>(endpoint: string, data: any): Observable<T> {
        return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data);
    }

    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
    }
}
```

### Interceptor de Autenticación

```typescript
// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('access_token');
    
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }
    
    return next(req);
};
```

### Guard de Autenticación

```typescript
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/auth/login']);
    return false;
};
```

---

## 📦 Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Variables | camelCase | `pedidoActual`, `isLoading` |
| Métodos | camelCase | `cargarPedidos()`, `guardar()` |
| Clases | PascalCase | `PedidoService`, `AuthGuard` |
| Interfaces | PascalCase con I | `IPedido`, `IUser` |
| Componentes | kebab-case | `pedido-list.component.ts` |
| Servicios | kebab-case | `pedido.service.ts` |
| Directivas | kebab-case | `has-role.directive.ts` |
| Pipes | kebab-case | `currency-cop.pipe.ts` |
| Constantes | UPPER_SNAKE_CASE | `API_URL`, `MAX_ITEMS` |
| Archivos | kebab-case | `pedido-list.component.html` |

---

## 🧪 Testing

### Comando
```bash
npm test
```

### Estructura de Tests

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidoListComponent } from './pedido-list.component';

describe('PedidoListComponent', () => {
    let component: PedidoListComponent;
    let fixture: ComponentFixture<PedidoListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PedidoListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PedidoListComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load pedidos on init', () => {
        component.ngOnInit();
        expect(component.pedidos().length).toBeGreaterThan(0);
    });
});
```

---

## 🎭 Roles del Sistema

1. `super_admin` - Acceso completo
2. `Administrador` - Gestión general
3. `Vendedor` - Pedidos y cotizaciones
4. `Analista` - Reportes y análisis
5. `Logistica` - Órdenes de compra/trabajo
6. `panel_user` - Usuario básico

### Directiva de Roles

```typescript
// src/app/shared/directives/has-role.directive.ts
@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective {
    // Implementar lógica para mostrar/ocultar según rol
}
```

```html
<!-- Uso -->
<p-button *hasRole="'Vendedor'" label="Crear Pedido" />
```

---

## ⚡ Comandos Útiles

```bash
# Desarrollo
npm start                                    # Puerto 4200
npm test                                     # Ejecutar tests
npm run lint                                 # Linter
npm run format                               # Formatear código

# Build
npm run build                                # Build producción
npm run build -- --configuration=production  # Build optimizado

# Generadores
ng g component features/pedidos/pedido-list --standalone
ng g service core/services/api
ng g guard core/guards/auth --functional
ng g interceptor core/interceptors/auth --functional
ng g pipe shared/pipes/currency-cop --standalone
ng g directive shared/directives/has-role --standalone
```

---

## ✅ Do's

- ✅ Usar **Standalone Components** exclusivamente
- ✅ Priorizar **Signals** sobre Observables
- ✅ Usar **nueva sintaxis** de control flow (@if, @for)
- ✅ Usar componentes de **PrimeNG** (Sakai)
- ✅ Usar **PrimeIcons** para iconos
- ✅ Implementar **interceptores** para auth
- ✅ Usar **guards** para proteger rutas
- ✅ Gestionar estado con **NgRx** (store complejo)
- ✅ Usar **async pipe** en templates
- ✅ Implementar **trackBy** en @for
- ✅ Usar **OnPush** change detection
- ✅ **Lazy loading** de módulos/features
- ✅ Seguir estructura de **Sakai template**
- ✅ Código en **inglés**, comentarios en español

## ❌ Don'ts

- ❌ Crear **NgModules** (usar standalone)
- ❌ Usar sintaxis antigua (*ngIf, *ngFor)
- ❌ Usar otras librerías de UI (solo PrimeNG)
- ❌ Manipular DOM directamente (usar Renderer2)
- ❌ Olvidar **unsubscribe** de Observables
- ❌ Hardcodear **URLs** de API
- ❌ Exponer **tokens** en código
- ❌ Confiar solo en validaciones frontend
- ❌ Usar `any` type sin justificación
- ❌ Ignorar errores de TypeScript
- ❌ Modificar estructura de **layout/** de Sakai
- ❌ Mezclar lógica de negocio en componentes

---

## 📦 Módulos a Desarrollar

1. **Pedidos** - Gestión con referencias
2. **Cotizaciones** - Generación con cálculos
3. **Órdenes de Compra** - Por proveedor
4. **Órdenes de Trabajo** - Tracking
5. **Terceros** - Clientes/proveedores
6. **Artículos** - Catálogo de productos
7. **Referencias** - Gestión de referencias
8. **Usuarios** - Gestión de accesos
9. **Chat** - Tiempo real (Pusher)
10. **Reportes** - Dashboard y gráficos

---

## 🎯 Próximos Pasos

1. ✅ Setup Angular 20 + Sakai + dependencias
2. ⏳ Crear estructura core/ (auth, guards, interceptors)
3. ⏳ Implementar autenticación con backend
4. ⏳ Crear módulos de features/
5. ⏳ Implementar NgRx store
6. ⏳ Desarrollar componentes compartidos
7. ⏳ Integrar con API Laravel
8. ⏳ Personalizar branding de Sakai
9. ⏳ Testing de componentes
10. ⏳ Optimización y performance

---

**Nota para IA**: Antes de sugerir cambios, verificar:
- `package.json` para dependencias instaladas
- `angular.json` para configuración del proyecto
- Backend API en `http://localhost:8000/api/v1`
- Template Sakai en `src/app/layout/` y `src/app/pages/`
- Usar **Standalone Components** y **Signals** de Angular 20

**Versión**: 1.0.0  
**Última actualización**: Enero 18, 2026  
**Stack**: Angular 20.3.16 + PrimeNG 20 + Sakai + TypeScript 5.8.3
