# HeavyMarket: Orquestador de Agentes

Bienvenido al sistema de gestión de HeavyMarket. Este archivo sirve como el punto de entrada principal para todos los agentes de IA, delegando tareas específicas a las **Skills** especializadas.

## Información del Proyecto
- **Propósito**: Gestión comercial moderna (pedidos, cotizaciones, inventario).
- **Backend**: Laravel 12 API (en `heavy-api/`).
- **Frontend**: Angular 20 SPA (en `heavy-front/`).
- **Infraestructura**: Docker y Scripts de despliegue automatizados.

## Reglas de Oro
1. **Idioma**: SIEMPRE en **ESPAÑOL** (interacciones y documentación).
2. **Modo Oscuro**: Todo desarrollo de UI debe ser compatible con Dark Mode.
3. **Despliegue**: Tras un `git pull` en servidor, ejecutar `./scripts/deploy.sh`.

## Memoria persistente (Engram MCP)

Las búsquedas sin proyecto suelen devolver **cero resultados** aunque existan memorias. Para este repositorio:

1. **Siempre** incluir `project: "heavymarket"` al llamar a `mem_search`, `mem_save` y `mem_session_summary`, salvo que el usuario pida explícitamente otro proyecto o ámbito personal.
2. Si `mem_search` devuelve vacío, **reintentar** la misma consulta con `project: "heavymarket"` antes de concluir que no hay contexto guardado.
3. Si otro agente o documentación indica un **ID de observación** (p. ej. `#39`), usar `mem_get_observation` con ese `id` para leer el contenido completo; no depende del filtro por proyecto en la búsqueda.

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
