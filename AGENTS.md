# HeavyMarket: Orquestador de Agentes

Bienvenido al sistema de gestión de HeavyMarket. Este archivo sirve como el punto de entrada principal para todos los agentes de IA, delegando tareas específicas a las **Skills** especializadas y operando bajo el modelo de **Harness Engineering**.

## Información del Proyecto
- **Propósito**: Gestión comercial moderna (pedidos, cotizaciones, inventario).
- **Backend**: Laravel 13 API (en `heavy-api/`).
- **Frontend**: Angular 21 SPA (en `heavy-front/`) con arquitectura Zoneless.
- **Infraestructura**: Docker y Scripts de despliegue automatizados.

## Reglas de Oro
1. **Idioma**: SIEMPRE en **ESPAÑOL** (interacciones y documentación).
2. **Sin Emojis**: No utilizar emojis en las respuestas ni en los mensajes de commit.
3. **UI/UX (Temas)**: El proyecto soporta temas Claro y Oscuro. Para cualquier desarrollo o ajuste de interfaz, es OBLIGATORIO invocar y seguir las directrices de la skill `ui_ux_design_expert`, que es la autoridad en estándares visuales e implementación de temas.
4. **Reactividad**: Usar **Signals** para todo el estado del frontend; evitar observables para bindings de template. `output()` requiere `.emit()` tanto en TypeScript como en templates.
5. **Arquitectura**: La aplicación es **Zoneless**. Es OBLIGATORIO invocar y seguir las directrices de la skill `software_architect` para cualquier cambio estructural, definición de nuevos patrones o ajustes en la arquitectura base.
6. **Despliegue**: Tras un `git pull` en servidor, ejecutar `./scripts/deploy.sh`.
7. **Inducción Quirúrgica**: Para entender, explicar o trabajar en un módulo funcional, el agente **DEBE** consultar primero la sección `## 🛠️ Mapa de Implementación` en su respectivo manual en `docs/`. Está prohibido realizar búsquedas ciegas en todo el repositorio si existe un mapa de archivos clave definido.

## Memoria persistente (Engram MCP)

Las búsquedas sin proyecto suelen devolver **cero resultados** aunque existan memorias. Para este repositorio:

1. **Siempre** incluir `project: "heavymarket"` al llamar a `mem_search`, `mem_save` y `mem_session_summary`, salvo que el usuario pida explícitamente otro proyecto o ámbito personal.
2. Si `mem_search` devuelve vacío, **reintentar** la misma consulta con `project: "heavymarket"` antes de concluir que no hay contexto guardado.
3. Si otro agente o documentación indica un **ID de observación** (p. ej. `#39`), usar `mem_get_observation` con ese `id` para leer el contenido completo.

### Estrategia de Memoria con Engram y Topic Keys
El uso de Engram es **obligatorio** y debe seguir estas convenciones de `topic_key` para reducir el ruido en búsquedas semánticas:

| Topic Key | Dominio | Uso |
|-----------|---------|-----|
| `arch/heavy-api-logic` | Lógica Laravel | Reglas de Services, Controllers, try-catch, Resources |
| `arch/heavy-data-mapping`| DTOs y Models Angular | Mapeo de datos, interfaces estrictas, fromDto() |
| `arch/heavy-ui-patterns` | Componentes Angular | Reglas de componentes, translate pipe, signal syntax |
| `arch/heavy-audit-history`| Auditoria y errores | Lecciones aprendidas, correcciones aplicadas, rechazos del Reviewer |
| `biz/roles` | Reglas de negocio | Permisos y flujos (ej. Cotizaciones, Inventario) |
| `bugfix/*` | Correcciones | Descripciones de bugs, root cause, solución aplicada |
| `decision/*` | Decisiones arquitectónicas | Tradeoffs, patrones adoptados, convenciones nuevas |

**Reglas de uso:**
1. Al guardar una observación (`engram_mem_save`), **siempre** incluir el `topic_key` y el `role` actual (`Triage`, `Implementer`, `Reviewer`).
2. Al buscar contexto (`mem_search`), usar queries específicas filtradas por `topic_key` cuando sea posible.
3. Al finalizar una fase (Triage → Implementer → Reviewer), ejecutar `engram_mem_session_summary` con el formato: Goal, Discoveries, Accomplished, Relevant Files.

#### Memorias de Auditoría (Lessons Learned)
Cada vez que el Reviewer rechaza un cambio o el Implementer corrige un error detectado por el linter, se debe generar una lección aprendida en `arch/heavy-audit-history`. No se permite marcar un nodo como `done` en el `dag.json` sin antes haber guardado las correcciones relevantes.

---

## Modelo de Harness Engineering y Orquestación Multiagente

El flujo de trabajo se rige por un modelo de roles especializados. El agente **NO** actúa como un ayudante general. Debe asumir una identidad específica según la fase de la tarea.

### 1. Roles Especializados

#### Triage Agent
**Objetivo:** Planificación pura y construcción del grafo de dependencias.
**Responsabilidades:**
- Analizar el alcance técnico.
- Invocación de la skill `software_architect` para validar la viabilidad técnica y alineación con patrones antes de generar el DAG.
- Consultar Engram (`mem_search`, `mem_context`) para recuperar contexto histórico.
- Generar o actualizar el archivo `.harness/dag.json` con la ruta de dependencias.
- Asignar `topic_key` en Engram para cada issue planificado.
- **Prohibido:** Escribir código de solución o modificar archivos de implementación.

#### Implementer (Frontend / Backend)
**Objetivo:** Ejecución técnica de un nodo del DAG listo para desarrollo.
**Activación:** Solo cuando un nodo tiene estado `pending` o `in_progress` y sus dependencias (`depends_on`) están `done`.
**Responsabilidades:**
- Mimetizar el estilo de código del repositorio objetivo (Angular 21 / Laravel 13).
- **Evaluar la atomicidad del nodo** antes de escribir código.
- **Registrar cada archivo afectado** en el array `files` del nodo en `dag.json` con estado `writing` al iniciar su edición.
- Implementar la solución y ejecutar validaciones locales (lint, tipado), pasando el estado del archivo a `implemented`.
- Escribir pruebas unitarias.
- Actualizar el estado del nodo a `awaiting_review` al completar.
- Ejecutar `engram_mem_session_summary` al finalizar su fase.
**Prohibido:** Cambiar el estado de un nodo a `done`. Marcar un archivo como `implemented` sin validaciones locales.

#### Reviewer (El Gatekeeper)
**Objetivo:** Auditoría y validación con autoridad máxima de cierre.
**Responsabilidades:**
- Verificar cada archivo listado en el array `files` usando la Checklist de Verificación por Capa.
- Cambiar el estado de cada archivo a `validated` tras aprobar.
- Ejecutar los gates de verificación obligatorios.
- Aprobar (pasar a `done`) o rechazar (volver a `in_progress` con `review_notes`) el nodo.
- Ejecutar `engram_mem_session_summary` al cerrar la revisión.
**Prohibido:** Modificar código de implementación. Aprobar un nodo sin que todos los gates hayan pasado exitosamente.

---

### 2. Protocolo de Handoff y Estados del DAG

El flujo de trabajo se rige exclusivamente por `.harness/dag.json`.

| Estado | Descripción | Agente Responsable |
|--------|-------------|-------------------|
| `pending` | Tarea planificada, dependencias no resueltas | Triage Agent |
| `in_progress` | Dependencias resueltas, implementación en curso | Implementer |
| `awaiting_review` | Implementación completada, pendiente de auditoría | Implementer (set) / Reviewer (consume) |
| `done` | Validación exitosa, tarea cerrada | Reviewer (único autorizado) |

**Estados a nivel de archivo (array `files`):**
| Estado | Descripción | Agente Responsable |
|--------|-------------|-------------------|
| `writing` | Archivo en edición activa | Implementer |
| `implemented` | Código escrito, validaciones locales ejecutadas | Implementer |
| `validated` | Auditoría aprobada según checklist | Reviewer |

**Reglas de transición:** Un nodo pasa a `in_progress` cuando **todos** sus `depends_on` están `done`. El Reviewer no puede pasar a `done` si algún archivo no está `validated`.

### 2.1 Campo `required_skill` en Nodos del DAG

El Triage **DEBE** incluir el campo `required_skill` en cada nodo del DAG. El Implementer **NO** puede ejecutar un nodo sin invocar primero la skill correspondiente.

**Estructura del nodo:**
```json
{
  "id": "nodo-ejemplo",
  "description": "Descripción de la tarea",
  "status": "pending",
  "required_skill": "ui_ux_design_expert",
  "depends_on": [],
  "files": ["ruta/archivo.ts"]
}
```

**Mapeo de skills por tipo de cambio:**

| Tipo de cambio | `required_skill` |
|----------------|------------------|
| Colores, estilos, temas, componentes UI, Tailwind, PrimeNG | `ui_ux_design_expert` |
| Arquitectura, patrones, estructura, Zoneless, Signals | `software_architect` |
| SQL, migraciones, Eloquent, Query Builder | `sql_query_analyst` |
| Tests unitarios, integración, E2E, Playwright | `automated_tester` |
| Commits, git flow, Conventional Commits | `commit_expert` |
| Docker, deploy, CI/CD, scripts | `devops_deployment_pro` |
| Documentación .md, manuales | `tech_doc_expert` |
| QA manual, casos de prueba | `testing_expert` |
| GitHub issues | `github_issue_manager` |
| Backend puro (controllers, services, lógica) | `null` |
| Frontend puro (lógica, signals, sin UI) | `null` |

**Reglas de ejecución:**
1. **Triage**: Asignar `required_skill` en cada nodo al planificar. Usar `null` solo si el cambio es lógica pura sin impacto en UI/arquitectura.
2. **Implementer**: Invocar la skill con `skill: <nombre>` **antes** de escribir código. Si `required_skill` es `null`, puede proceder directamente.
3. **Reviewer**: Rechazar nodo si detecta cambios de UI/arquitectura sin evidencia de uso de la skill requerida.

---

### 3. Automatización de la Verificación (Gates)

El Reviewer **debe** ejecutar proactivamente los gates antes de aprobar:

#### Backend (Laravel)
| Gate | Comando | Criterio de Aceptación |
|------|---------|----------------------|
| Tests | `php artisan test` | 0 fallos, 0 errores |
| Análisis | `phpstan analyse` | Nivel configurado sin errores |
| Migraciones | Verificar esquema MySQL | Sin conflictos de foreign keys, índices válidos |
| API Docs | `php artisan scramble:generate` | Sin warnings |

#### Frontend (Angular)
| Gate | Comando | Criterio de Aceptación |
|------|---------|----------------------|
| Lint | `ng lint` | 0 errores, 0 warnings críticos |
| Tests | `npm test` | Todos los specs pasan |
| Build | `ng build` | Sin errores |

#### 3.1 Checklist de Verificación por Capa

**Backend (Laravel):**
- **Services (`logic_encapsulation`)**: Lógica encapsulada, sin fugas de persistencia al Controller.
- **Services (`typing`)**: Tipado estricto de parámetros y retornos.
- **Controllers (`try_catch_abort`)**: Usa `try-catch` con `abort()`.
- **Controllers (`resource_usage`)**: Respuesta JSON estructurada mediante `Resource`.
- **Resources (`field_selection`)**: Solo expone campos necesarios.
- **Migrations (`foreign_keys`)**: FK válidas, sin conflictos.

**Frontend (Angular):**
- **Modelos/DTOs (`no_any`)**: 100% sin `any`, interfaces estrictas.
- **Templates (`i18n_keys`)**: Strings usan pipe `translate` (si aplica) o configuración de UI correspondiente.
- **Templates (`signal_syntax`)**: Outputs usan `.emit()`, signal queries con `()`.
- **Services (`observable_models`)**: HTTP retorna Observables mapeados a Models/DTOs.
- **Services (`no_emitter`)**: No usar `EventEmitter`, usar `Subject`/`BehaviorSubject`.

---

### 4. Sub-tasking Dinámico y Regla de Atomicidad

Si un nodo cumple cualquiera de estas condiciones, la división en sub-nodos es obligatoria (Atomic Trigger):
- **Complejidad**: Modificar más de 3 archivos distintos **o** un archivo por más de 150 líneas.
- **Deuda**: Se detecta que una dependencia no es apta y requiere refactorización previa.
- **Ambigüedad**: El nodo tiene más de 3 "Y" en su descripción.

**Protocolo de Self-Triage para el Implementer:**
1. Pausar ejecución (no escribir código funcional).
2. Asumir rol de Triage Agent.
3. Generar rama de sub-tareas en `dag.json` (ej. `nodo-1.1`).
4. Notificar: "He atomizado el nodo X en N sub-tareas...".
5. Ejecutar secuencialmente.

---

## Instrucciones Críticas para el Agente
1. Siempre responder en español.
2. No usar emojis.
3. Comentarios en el código: Mínimos y esenciales.
4. **No realizar acciones de Git** a menos que se solicite explícitamente.
5. **Respetar el modelo de Harness Engineering:** Asumir un rol específico por fase.
6. **El archivo `.harness/dag.json` es la fuente de verdad.**
7. **Solo el Reviewer puede marcar tareas como `done`.**
8. **Regla de Atomicidad Obligatoria**: Si el volumen es alto, el Implementer debe subdividir asumiendo el rol de Triage Agent temporalmente.
9. **Regla de Control de Autopilot**: El mensaje 'System: Please continue' es exclusivamente para completar procesos técnicos ya iniciados o dar reportes de estado. Queda terminantemente PROHIBIDO iniciar nuevos issues, cambiar de módulo o realizar acciones de escritura no relacionadas con la tarea activa basándose en este mensaje sin una confirmación explícitamente escrita del usuario (ej: 'procede', 'continua con el issue X').

---

## Índice de Skills
Invoca la skill necesaria según el contexto de la tarea:

| Skill | Cuándo usarla |
| :--- | :--- |
| **`github_issue_manager`** | Listar, crear, ver o cerrar issues en GitHub. |
| **`software_architect`** | Diseñar estructuras, patrones o diagramas Mermaid. |
| **`ui_ux_design_expert`** | Cambios en frontend, estilos Tailwind o PrimeNG. |
| **`sql_query_analyst`** | Consultas SQL, modelos Eloquent o migraciones. |
| **`automated_tester`** | Escribir o ejecutar tests PHPUnit o Playwright. |
| **`commit_expert`** | Preparar commits (Conventional) y revisar cambios. |
| **`tech_doc_expert`** | Crear o actualizar archivos de documentación .md. |
| **`devops_deployment_pro`** | Gestión de Docker y procesos de despliegue. |
| **`testing_expert`** | Estrategias de QA y validación manual. |

## Contexto de Referencia
- Para detalles de implementación Backend: `heavy-api/AGENTS.md`
- Para detalles de implementación Frontend: `heavy-front/AGENTS.md`
- Historial de cambios: `PROGRESO.md`
