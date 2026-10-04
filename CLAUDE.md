# HeavyMarket

Este repo opera bajo un modelo formal de roles ("Harness Engineering") documentado en `AGENTS.md` (raíz), `heavy-api/AGENTS.md` y `heavy-front/AGENTS.md`. **Léelos antes de tocar código o responder sobre arquitectura.**

## Regla crítica: invocación de roles

Cuando el usuario diga "asume el rol de Triage / Implementer / Reviewer" (o equivalente), es la invocación formal de ese rol — no lenguaje informal para "investiga y arregla". Cada rol tiene responsabilidades y **prohibiciones explícitas** en `AGENTS.md`:

- **Triage**: solo planifica (analiza alcance, consulta Engram, genera/actualiza nodos en `.harness/dag.json` con `topic_key` y `required_skill`). **Prohibido escribir código o modificar archivos de implementación.**
- **Implementer**: solo ejecuta nodos ya planificados con dependencias `done`, invocando primero la skill indicada en `required_skill`. **Prohibido marcar un nodo como `done`.**
- **Reviewer**: solo audita — ejecuta los gates, valida contra la checklist de `AGENTS.md`, y aprueba/rechaza. **Prohibido modificar código de implementación.**

`.harness/dag.json` es la fuente de verdad del estado de las iniciativas. Revísalo antes de empezar cualquier tarea. Si un pedido llega fuera del flujo del harness (fix puntual, pregunta suelta), créale o actualízale igualmente un nodo — salvo que el usuario indique explícitamente que quiere saltarse el DAG para ese caso.

## Encadenamiento autónomo de roles (Autopilot de ciclo completo)

Una vez que el usuario da luz verde a trabajar sobre un issue o nodo (ya sea con "procede", "arregla X", "implementa Y", o invocando Triage directamente), el agente encadena **Triage → Implementer → Reviewer sin pausar a pedir confirmación entre fases**, incluyendo nodos que disparan la regla de atomicidad (backend con migraciones, arquitectura, >3 archivos). Cada rol sigue respetando sus prohibiciones propias (Triage no escribe código, Implementer no marca `done`, Reviewer no toca código de implementación) — lo que cambia es que la transición de un rol al siguiente es automática, no una pausa para que el usuario autorice la siguiente fase. Al final del ciclo se reporta el resultado completo en un solo mensaje (o con actualizaciones breves en el camino si la tarea es larga).

**Excepción real (no cosmética):** si durante cualquier fase aparece un bloqueo genuino — gates que fallan sin fix evidente, ambigüedad de producto que ningún archivo resuelve, falta de acceso/credenciales, o un conflicto que requiere una decisión de negocio — el agente se detiene y pregunta. La autonomía es sobre no pedir permiso para pasar de fase, no sobre ocultar problemas reales.

**Git**: al aprobar un nodo (Reviewer → `done`), el agente hace `git commit` de los archivos de ese nodo automáticamente, sin pedir confirmación. **No hace `git push`** — los commits se acumulan y el push se hace únicamente cuando el usuario lo pide explícitamente (igual que cerrar el issue en GitHub, que depende del push por el `Closes #N`).

Ver `AGENTS.md` para: convenciones de Engram (`topic_key` obligatorio), mapeo de skills por tipo de cambio, tabla de gates de verificación por capa (backend/frontend), y reglas de atomicidad/sub-tasking.
