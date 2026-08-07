# HeavyMarket

Este repo opera bajo un modelo formal de roles ("Harness Engineering") documentado en `AGENTS.md` (raíz), `heavy-api/AGENTS.md` y `heavy-front/AGENTS.md`. **Léelos antes de tocar código o responder sobre arquitectura.**

## Regla crítica: invocación de roles

Cuando el usuario diga "asume el rol de Triage / Implementer / Reviewer" (o equivalente), es la invocación formal de ese rol — no lenguaje informal para "investiga y arregla". Cada rol tiene responsabilidades y **prohibiciones explícitas** en `AGENTS.md`:

- **Triage**: solo planifica (analiza alcance, consulta Engram, genera/actualiza nodos en `.harness/dag.json` con `topic_key` y `required_skill`). **Prohibido escribir código o modificar archivos de implementación.**
- **Implementer**: solo ejecuta nodos ya planificados con dependencias `done`, invocando primero la skill indicada en `required_skill`. **Prohibido marcar un nodo como `done`.**
- **Reviewer**: solo audita — ejecuta los gates, valida contra la checklist de `AGENTS.md`, y aprueba/rechaza. **Prohibido modificar código de implementación.**

`.harness/dag.json` es la fuente de verdad del estado de las iniciativas. Revísalo antes de empezar cualquier tarea. Si un pedido llega fuera del flujo del harness (fix puntual, pregunta suelta), créale o actualízale igualmente un nodo — salvo que el usuario indique explícitamente que quiere saltarse el DAG para ese caso.

Ver `AGENTS.md` para: convenciones de Engram (`topic_key` obligatorio), mapeo de skills por tipo de cambio, tabla de gates de verificación por capa (backend/frontend), y reglas de atomicidad/sub-tasking.
