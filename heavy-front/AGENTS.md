# Contexto y Guía para Agentes de IA - HeavyMarket (Frontend)

> **IMPORTANTE**: Todas las interacciones, documentación y reportes de estado deben ser en **ESPAÑOL**. Ver `AGENTS.md` en la raíz para reglas completas.

## Stack Tecnológico
- **Framework**: Angular 20 (Última versión).
- **UI Kit**: PrimeNG 20 + TailwindCSS (vía tailwindcss-primeui).
- **Estado**: NgRx (Store, Effects, Entity).
- **Lenguaje**: TypeScript (Modo estricto).

## Arquitectura del Proyecto (`src/app`)
La aplicación sigue una arquitectura basada en características (features) y capas:

- **`core/`**: Servicios singleton, guardias, interceptores y utilidades globales.
- **`features/`**: Módulos de negocio reutilizables (ej. componentes complejos funcionales).
- **`layout/`**: Componentes de estructura (Header, Sidebar, MainLayout).
- **`pages/`**: Componentes vistas que corresponden a rutas (Smart Components).
- **`store/`**: Configuración global de NgRx.

## Mejores Prácticas y Reglas

### 1. Componentes (Angular 20)
- **Standalone**: Todos los componentes deben ser `standalone: true`.
- **Signals**: Prefiere el uso de Signals para reactividad local y `input()` / `output()` basados en signals si es posible en esta versión.
- **Change Detection**: Usar explícitamente `ChangeDetectionStrategy.OnPush` en todos los componentes para rendimiento.
- **Estructura**:
  - `pages/`: Componentes "inteligentes" que inyectan fachadas o store y pasan datos a componentes hijos.
  - `features/`: Componentes que encapsulan lógica de negocio específica.

### 2. Gestión de Estado (NgRx)
- Usar el Store para estado global compartido (Usuario, Carrito, Configuración, Cache de datos maestros).
- Para estado local de componente o formulario simple, usar servicios locales o Signals.
- **Patrón**: Actions -> Reducers -> Selectors -> Effects.
- Usar `createActionGroup` y `createFeature` para reducir boilerplate.

### 3. Estilos (Tailwind + PrimeNG)
- **NO escribir CSS personalizado** si se puede resolver con utilidades de Tailwind.
- Usar las clases de utilidad de PrimeNG cuando sea necesario integrar con el tema.
- Mantener el diseño responsive (Mobile First).
- Personalización de temas a través de la configuración de PrimeNG, no de CSS global.

### 4. Consultas HTTP
- Tipar fuertemente todas las respuestas de API (Interfaces en `core/models` o `features/x/models`).
- Manejar errores centralizadamente a través de Interceptores, pero permitir manejo local si es UX crítica.

### 5. Formularios
- Usar `ReactiveForms` tipados estrictamente.
- Validaciones deben reflejar las reglas del backend (Laravel).

## Scripts de Ayuda
- `npm start`: Servidor de desarrollo.
- `npm run format`: Formatear código con Prettier.
- `npm run lint`: Verificar calidad de código.
