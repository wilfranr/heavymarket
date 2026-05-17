# Heavy Front - Frontend Angular 21 (Zoneless)

Frontend SPA para el sistema HeavyMarket construido con **Angular 21** y **PrimeNG 21** (arquitectura moderna basada en Signals).

## Tecnologías Principales

- **Angular 21.0+** - Framework frontend con arquitectura **Zoneless**.
- **Signals** - Motor de reactividad primario para gestión de estado y detección de cambios.
- **PrimeNG 21** - Librería de componentes UI premium.
- **Tailwind CSS 4** - Framework CSS utility-first con integración nativa PrimeUI.
- **NgRx 19** - Gestión de estado global (Store, Effects) utilizado para datos transversales.
- **Playwright** - Framework de pruebas de integración y E2E.

## Arquitectura del Proyecto

El proyecto sigue una estructura modular basada en características (features), optimizada para Lazy Loading y mantenibilidad.

```
src/app/
├── core/                # Funcionalidad core y singletons
│   ├── auth/           # Autenticación, guards e interceptores
│   ├── services/       # Servicios de comunicación API (Signals-based)
│   └── models/         # Interfaces y DTOs estrictos
├── features/            # Módulos de negocio (Smart Components)
│   ├── pedidos/
│   ├── cotizaciones/
│   ├── sistemas/       # Gestión de sistemas de maquinaria
│   ├── listas/         # Catálogos y tipos de artículo
│   └── terceros/
├── shared/              # Componentes, directivas y pipes reutilizables
├── layout/              # Estructura visual (sidebar, topbar)
└── store/               # Estado global NgRx (Actions, Reducers, Selectors)
```

## Estándares de Desarrollo

### 1. Reactividad con Signals
El proyecto es **Zoneless**. Toda la comunicación entre componentes y la gestión de estado local debe realizarse mediante **Signals** (`signal`, `computed`, `effect`). Se debe evitar el uso de `BehaviorSubject` para bindings de template.

### 2. Estilos y UI
Se utiliza **Tailwind CSS 4** para el layout y espaciado. No se permite el uso de PrimeFlex. Para colores y tematización, se deben usar las variables CSS de PrimeNG (ej. `var(--p-primary-color)`) para garantizar compatibilidad con el **Modo Oscuro**.

### 3. Relaciones N:N
Para la gestión de relaciones múltiples (ej. Sistemas y Tipos de Artículo), se utiliza el componente `MultiSelect` de PrimeNG y la utilidad `appendSistemaIdsToFormData` para la persistencia vía `FormData`.

## Instalación y Ejecución

### Instalar Dependencias
```bash
npm install
```

### Iniciar Servidor de Desarrollo
```bash
npm start
```
La aplicación estará disponible en `http://localhost:4200`

### Build de Producción
```bash
ng build
```

## Comandos Útiles

```bash
# Ejecutar tests E2E
npx playwright test

# Ejecutar linter
npm run lint

# Formatear código
npm run format
```

## Documentación de Referencia

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [PrimeNG Documentation](https://primeng.org/)
- [Tailwind CSS 4](https://tailwindcss.com/docs/v4-beta)
- [NgRx Documentation](https://ngrx.io/)

---
**Última actualización:** 17 de Mayo, 2026
