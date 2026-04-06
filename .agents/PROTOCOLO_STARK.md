# 🛡️ Protocolo Stark: Manual de Operaciones - HeavyMarket

Este documento define el flujo de trabajo agnóstico basado en **Memoria Persistente (Engram)**, **Skills Modulares** y **Planificación Estructurada (DAG)**.

---

## 1. Arquitectura del Sistema

El sistema se divide en tres capas para asegurar que la "verdad" técnica sea universal:

| Capa | Descripción |
|------|-------------|
| **El Cerebro (Engram)** | Base de datos SQLite local que almacena decisiones, requerimientos y el estado del DAG. Accesible vía MCP. |
| **Las Herramientas (Clients)** | - OpenCode / Gemini CLI: Terminal y lógica pesada (Backend/DB)<br>- Cursor / Antigravity: Desarrollo visual y UI (Frontend/Mobile) |
| **El Sistema Nervioso (MCP)** | Protocolo que conecta la memoria con cualquier IA |

---

## 2. Configuración de Referencia (Ubuntu)

Rutas críticas para corregir errores de conexión (ENOENT):

- **Binario Engram**: `/home/yoseth/.linuxbrew/bin/engram`

### Configuración Universal (mcp.json en raíz)

```json
{
  "mcp": {
    "servers": {
      "engram": {
        "command": "/home/yoseth/.linuxbrew/bin/engram",
        "args": ["mcp"]
      }
    }
  }
}
```

---

## 3. El Flujo de Trabajo Diario

### Fase A: Inicio de Jornada (El "Despertar")

**Objetivo:** Sincronizar el estado mental de la IA con los Issues pendientes.

> **Prompt:** "Sincroniza con Engram. Analiza los issues de GitHub en memoria para HeavyMarket. Resume los 3 más críticos (Laravel/SQL Server) y propón un mini-DAG para abordar el primero hoy."

---

### Fase B: Sesión con el Cliente (Captura de Requerimientos)

**Objetivo:** Convertir notas informales en estructura técnica inmediata.

> **Prompt:** "Actúa como Business Analyst. Procesa estas notas de la reunión: [NOTAS]. Regístralas en Engram como 'Client Requirement', vincula o crea los Issues en GitHub usando nuestras plantillas y actualiza el DAG de dependencias."

---

### Fase C: Ejecución y Desarrollo

**Objetivo:** Mantener la trazabilidad mientras programas.

- **Backend (OpenCode):** "Implementa la lógica de [X] en el Service de Laravel. Consulta en Engram si hay restricciones de DB previas."
- **Frontend (Cursor):** "Refactoriza el componente [Y] en Angular. Usa el tipado estricto definido en Engram y valida con la captura visual de referencia."

---

### Fase D: Cierre y Checkpoint (Higiene del Proyecto)

**Objetivo:** Asegurar que el trabajo de hoy sea la base del mañana.

> **Prompt:** "Invoca skills de Testing y Commit Expert. Genera el commit `feat/fix: ...`, cierra el Issue #N y registra en Engram el 'Key Learning' del día. Limpia archivos temporales y apaga motores."

---

## 4. Matriz de Selección de Herramientas

| Tarea | Herramienta Sugerida | Ventaja |
|-------|---------------------|---------|
| Lógica Backend / SQL | OpenCode | Alta velocidad de respuesta y precisión en terminal |
| UI / UX / Mobile | Cursor / Antigravity | Soporte visual (imágenes) y edición multi-archivo |
| Análisis Masivo / Auditoría | Gemini CLI | Ventana de contexto gigante para buscar errores en todo el repo |
| Documentación / GitHub | Antigravity | Excelente gestión de Markdown y automatización de Issues |

---

## 5. Tips de Mantenimiento de Memoria

1. **No confíes en la "Alucinación de Guardado"**: Si la IA dice que guardó algo pero no ves el log del servidor MCP, oblígala: *"Usa la herramienta mem_save ahora mismo"*.

2. **Etiquetado**: Siempre pide que las observaciones tengan el tag `heavymarket`.

3. **Higiene de Archivos**: Permite que la IA borre archivos `.bak` o temporales de migración, pero protege siempre los archivos `.json` de configuración de MCP.

4. **Consistencia Eventual**: Recuerda que en procesos asíncronos (Jobs de Laravel), el frontend debe manejar un delay o estados de carga (NgRx) para reflejar los cambios en la memoria.

---

## Estado del Sistema

✅ Todos los agentes configurados y sincronizados. Listo para la ejecución del próximo Issue del DAG.