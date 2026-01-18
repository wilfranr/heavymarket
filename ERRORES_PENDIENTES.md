# Errores Pendientes - HeavyMarket Frontend

**Fecha**: 18 de Enero, 2026  
**Estado**: En proceso de corrección

## Resumen

Durante la ejecución de `npm start` se detectaron **60+ errores de compilación** en el frontend Angular 20. La mayoría están relacionados con cambios en PrimeNG v20 y ajustes en los modelos de datos.

---

## Categorías de Errores

### 1. Componentes de PrimeNG Obsoletos/Cambiados (CRÍTICO)

#### ❌ p-dropdown (12 errores)
**Problema**: Los templates HTML usan `<p-dropdown>` pero el import es `SelectModule`.

**Archivos afectados**:
- `src/app/features/pedidos/create/create.html`
- `src/app/features/pedidos/edit/edit.html`
- `src/app/features/pedidos/list/pedidos-list.component.ts`

**Solución**: Reemplazar `<p-dropdown>` por `<p-select>` en todos los templates.

**Propiedades afectadas**:
- `[options]` → Verificar si existe en p-select
- `[filter]` → Verificar si existe en p-select
- `[showClear]` → Verificar si existe en p-select
- `[(ngModel)]` → Verificar sintaxis en p-select

---

#### ❌ p-tabView / p-tabPanel (9 errores)
**Problema**: Los componentes `<p-tabView>` y `<p-tabPanel>` no existen en PrimeNG 20.

**Archivo afectado**:
- `src/app/features/pedidos/detail/detail.html`

**Solución**: Investigar la nueva API de Tabs en PrimeNG 20. Posiblemente usar `<p-tabs>` y `<p-tab>`.

**Código actual** (líneas 78-127):
```html
<p-tabView>
    <p-tabPanel header="Referencias ({{ pedido.referencias.length }})">
        ...
    </p-tabPanel>
    <p-tabPanel header="Artículos ({{ pedido.articulos.length }})">
        ...
    </p-tabPanel>
</p-tabView>
```

**Nuevo formato** (a investigar):
```html
<p-tabs>
    <p-tab title="Referencias ({{ pedido.referencias.length }})">
        ...
    </p-tab>
    <p-tab title="Artículos ({{ pedido.articulos.length }})">
        ...
    </p-tab>
</p-tabs>
```

---

#### ❌ p-overlayPanel (2 errores)
**Problema**: El componente `<p-overlayPanel>` no existe o cambió de nombre.

**Archivo afectado**:
- `src/app/layout/component/app.topbar.ts` (línea 103)

**Solución**: Se importó `PopoverModule` pero el HTML sigue usando `<p-overlayPanel>`.  
Reemplazar por `<p-popover>` o usar el nuevo API de PrimeNG 20.

**Error adicional**: Método `.toggle()` no existe en el elemento (línea 86).

---

### 2. Modelos de Datos (MEDIO)

#### ❌ Pedido.referencias_proveedor (4 errores)
**Problema**: El modelo `Pedido` no tiene la propiedad `referencias_proveedor`.

**Archivo afectado**:
- `src/app/features/pedidos/detail/detail.html` (líneas 122, 125)

**Solución**: 
- Opción 1: Agregar `referencias_proveedor` al modelo `Pedido` en `pedido.model.ts`
- Opción 2: Eliminar o comentar esas secciones del template si no son necesarias

**Código a revisar**:
```typescript
export interface Pedido {
    // ... otras propiedades
    referencias_proveedor?: any[]; // ¿Agregar esto?
}
```

---

### 3. Severities de Botones (MENOR)

#### ❌ severity="warning" (2 errores)
**Problema**: PrimeNG 20 no acepta `"warning"` como valor de `ButtonSeverity`.

**Archivos afectados**:
- `src/app/features/pedidos/list/pedidos-list.component.ts` (líneas 94, 111)

**Solución**: Cambiar `severity="warning"` por `severity="warn"`.

**Valores válidos**: `"success" | "info" | "warn" | "danger" | "help" | "secondary" | "contrast" | null`

---

### 4. Acciones y Selectores de NgRx (MENOR)

#### ✅ selectPedidos → selectAllPedidos (ARREGLADO)
**Problema**: El componente usaba `selectPedidos` que no existe.

**Archivo**: `pedidos-list.component.ts` (línea 158)

**Estado**: Ya corregido en código, pendiente de verificación.

---

#### ❌ loadPedidos queryParams (1 error)
**Problema**: La acción `loadPedidos` espera `params` pero se está enviando `queryParams`.

**Archivo**: `recentsaleswidget.ts` (línea 55)

**Solución**:
```typescript
// Cambiar de:
this.store.dispatch(loadPedidos({ queryParams: { per_page: 10, sort: '-created_at' } }));

// A:
this.store.dispatch(loadPedidos({ params: { per_page: 10, sort: '-created_at' } }));
```

---

#### ❌ recentPedidos$ tipo null (1 error)
**Problema**: El Observable puede retornar `null` pero la tabla espera `Pedido[]`.

**Archivo**: `recentsaleswidget.ts` (línea 22)

**Solución**: Ya está corregido con `.map(pedidos => (pedidos || []))`, pero necesita verificación.

---

## Prioridades de Corrección

### 🔴 Alta Prioridad (Bloquean compilación)
1. ✅ **Selectores duplicados** - ARREGLADO
2. ✅ **InputTextModule duplicado** - ARREGLADO
3. ✅ **delete() → deletePedido/deleteTercero()** - ARREGLADO
4. ✅ **tercero.nombre → tercero.razon_social** - ARREGLADO
5. ✅ **ViewChild dt en terceros list** - ARREGLADO
6. ❌ **p-dropdown → p-select** (12 instancias) - PENDIENTE
7. ❌ **p-tabView → p-tabs** (1 instancia) - PENDIENTE
8. ❌ **p-overlayPanel → p-popover** (1 instancia) - PENDIENTE

### 🟡 Media Prioridad (Funcionalidad incorrecta)
9. ❌ **referencias_proveedor** en Pedido - PENDIENTE
10. ❌ **loadPedidos params** - PENDIENTE
11. ❌ **severity="warning" → "warn"** - PENDIENTE

### 🟢 Baja Prioridad (Optimizaciones)
12. ✅ **Verificar tests después de cambios** - PENDIENTE

---

## Estrategia de Corrección Sugerida

### Fase 1: Investigación de PrimeNG 20 API (30 min)
- [ ] Revisar documentación oficial de PrimeNG 20 para `Select`, `Tabs`, y `Popover`
- [ ] Verificar nombres correctos de componentes y propiedades
- [ ] Crear archivo de referencia con equivalencias

### Fase 2: Corrección de Templates HTML (1 hora)
- [ ] Reemplazar todos los `<p-dropdown>` por `<p-select>`
- [ ] Actualizar sintaxis de `<p-tabView>/<p-tabPanel>` a nuevo formato
- [ ] Corregir `<p-overlayPanel>` en topbar

### Fase 3: Corrección de Modelos y Tipos (30 min)
- [ ] Decidir sobre `referencias_proveedor` en Pedido
- [ ] Arreglar `loadPedidos` params
- [ ] Cambiar severities de `warning` a `warn`

### Fase 4: Verificación (30 min)
- [ ] Ejecutar `npm start` y verificar compilación limpia
- [ ] Probar navegación básica en la aplicación
- [ ] Ejecutar tests unitarios

---

## Notas Técnicas

### PrimeNG 20 Breaking Changes
PrimeNG 20 introdujo cambios significativos en la API de componentes:
- Muchos componentes fueron renombrados o reorganizados
- Las propiedades de algunos componentes cambiaron
- Algunos módulos ya no existen o tienen nombres diferentes

**Referencia**: https://primeng.org/migration/20

### Estado de Correcciones

**Completadas**: 6/12 (50%)  
**Pendientes**: 6/12 (50%)  
**Tiempo estimado restante**: 2-3 horas

---

## Próximos Pasos

1. **Inmediato**: Investigar API de PrimeNG 20 para los 3 componentes problemáticos
2. **Seguido de**: Actualizar todos los templates HTML
3. **Finalmente**: Verificar compilación y funcionalidad básica

---

**Última actualización**: 18/01/2026 23:30
