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

---

## ⚠️ REGLA CRÍTICA: CONSULTAR PRIMERO, INVENTAR NUNCA

> **ANTES de escribir cualquier HTML, CSS o componente nuevo, SIEMPRE revisar cómo se resuelve el mismo patrón en los recursos existentes del proyecto.**
>
> Recursos de referencia obligatorios (en orden de prioridad):
> 1. `src/app/features/listas/` — CRUD completo de referencia (list, create, edit, detail)
> 2. `src/app/features/maquinas/` — CRUD con tablas y formularios
> 3. `src/app/features/fabricantes/` — CRUD simple
> 4. `src/app/features/terceros/` — CRUD con relaciones

---

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

### 3. Estilos (Tailwind + PrimeNG) — REGLAS ESTRICTAS

#### ✅ LO QUE SE USA en este proyecto:
- **Tailwind puro** para layout y espaciado: `flex`, `grid`, `gap-*`, `items-center`, `justify-between`, `justify-end`, `w-full`, `text-sm`, `font-medium`, `mb-2`, `pt-*`, etc.
- **`<p-button>`** como componente Angular (NO `<button pButton>`).
- **`class="field"`** para wrappear cada campo de formulario — el label encima y el input abajo sin necesitar flex.
- **`pTextarea`** (directiva, con T mayúscula) en textareas, no `p-textarea`.
- **Variables CSS de PrimeNG** para colores de tema: `var(--p-surface-border)`, `var(--p-primary-color)`, etc.
- **`p-button` con `severity`** para variantes: `severity="secondary"`, `severity="danger"`, `severity="warn"`, etc.

#### ❌ LO QUE NUNCA SE DEBE USAR:
- **PrimeFlex** — esta librería NO está en el proyecto. Las siguientes clases NO funcionan:
  - `flex-column` → usar `flex-col` (Tailwind)
  - `align-items-center` → usar `items-center` (Tailwind)
  - `justify-content-end` → usar `justify-end` (Tailwind)
  - `justify-content-between` → usar `justify-between` (Tailwind)
  - `surface-100`, `surface-border`, `text-600`, `text-900` como clases directas (son de PrimeFlex/PrimeNG theme, no Tailwind)
- **`bg-surface-{número}`** (ej. `bg-surface-50`, `bg-surface-100`) — NO son tokens válidos de PrimeNG Tailwind. Tailwind los interpreta como colores de escala de grises (`gray-50` = blanco), lo que **rompe el modo oscuro**. Usar en cambio:
  - Variables CSS: `style="background: var(--p-surface-card)"`
  - O simplemente no poner fondo y dejar heredar el color oscuro del tema
- **`<button pButton>`** — usar `<p-button>` component en su lugar
- **`class="p-button-success"`, `p-button-danger"`** — usar `severity="success"` como prop de `<p-button>`
- CSS hardcodeado de colores (`bg-white`, `bg-black`, `text-white`) sin considerar dark mode

#### Patrón correcto para formularios en Dialog:
```html
<div class="grid grid-cols-1 gap-4 pt-2">
  <div class="field">
    <label for="campo" class="block text-sm font-medium mb-2">Label <span class="text-red-500">*</span></label>
    <input pInputText id="campo" [(ngModel)]="model.campo" class="w-full" placeholder="..." />
  </div>
  <div class="field">
    <label for="textarea" class="block text-sm font-medium mb-2">Descripción</label>
    <textarea pTextarea id="textarea" [(ngModel)]="model.desc" [rows]="3" class="w-full"></textarea>
  </div>
</div>
```

#### Patrón correcto para footer de Dialog:
```html
<ng-template pTemplate="footer">
  <p-divider />
  <div class="flex justify-end gap-2">
    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="dialog = false" />
    <p-button label="Guardar" icon="pi pi-check" (onClick)="save()" />
  </div>
</ng-template>
```

#### Patrón correcto para secciones expandidas en tabla (dark mode compatible):
```html
<td colspan="N" class="p-0 border-none">
  <div class="px-6 py-4" style="border-top: 1px solid var(--p-surface-border);">
    <!-- contenido -->
  </div>
</td>
```

### 4. Consultas HTTP
- Tipar fuertemente todas las respuestas de API (Interfaces en `core/models` o `features/x/models`).
- Manejar errores centralizadamente a través de Interceptores, pero permitir manejo local si es UX crítica.

### 5. Formularios
- Usar `ReactiveForms` tipados estrictamente en formularios de páginas dedicadas (create/edit).
- Para dialogs inline simples, `ngModel` es aceptable.
- Validaciones deben reflejar las reglas del backend (Laravel).

### 6. Diseño UI/UX y Tematización
- **Soporte Dual (Claro/Oscuro)**: Todos los componentes y vistas nuevas o modificadas DEBEN funcionar y verse bien tanto en modo claro (Light Mode) como en modo oscuro (Dark Mode).
  - Nunca hardcodear colores de fondo o texto que solo funcionen en un modo.
  - Usar variables CSS de PrimeNG (`var(--p-surface-*)`, `var(--p-primary-*)`) para colores adaptativos.
  - Verificar siempre el contraste en ambos modos antes de dar por terminado.
- **Estilo Visual**: Mantener consistencia con el diseño premium de HeavyMarket.
- **Consistencia**: Si existe un componente similar en el proyecto, replicar su estructura exacta, no inventar una nueva.

## Scripts de Ayuda
- `npm start`: Servidor de desarrollo.
- `npm run format`: Formatear código con Prettier.
- `npm run lint`: Verificar calidad de código.
