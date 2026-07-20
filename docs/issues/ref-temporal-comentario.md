# refactor: Ocultar columna comentario en listado de referencias (Frontend)

**Tipo:** Refactor / UI
**Prioridad:** Media
**Módulo:** Frontend - Listado de Referencias
**Issue relacionado:** N/A

---

## Problema

En el listado de referencias del frontend se muestra una columna "Comentario" que ocupa espacio visual y no aporta valor significativo en la vista de lista. El tag "Temporal" ya identifica las referencias que vienen de Landing.

---

## Decision funcional

Ocultar la columna `comentario` en el listado de referencias del frontend.

- El tag `es_temporal` (etiqueta "Temporal") se mantiene visible en la columna Referencia.
- El campo `comentario` permanece en el backend para uso futuro si es necesario.
- La búsqueda global (globalFilterFields) ya no incluye 'comentario'.

---

## Cambios tecnicos

### Frontend

**Archivo:** `heavy-front/src/app/features/referencias/list/list.html`

1. Eliminar `<th>Comentario</th>` del header de la tabla.
2. Eliminar el `<td>` correspondiente a la columna comentario.
3. Ajustar colspan del mensaje vacío de 6 a 5.
4. Quitar 'comentario' del globalFilterFields.

---

## Criterios de aceptacion

- [ ] Columna comentario no aparece en el listado de referencias.
- [ ] Tag "Temporal" sigue visible en la columna Referencia.
- [ ] El filtrado por temporales sigue funcionando.
- [ ] Build de Angular pasa sin errores.

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `heavy-front/src/app/features/referencias/list/list.html` | Ocultar columna comentario |
