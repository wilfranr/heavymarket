# Contexto del Agente — HeavyMarket

Este archivo es leído automáticamente por Antigravity al inicio de cada conversación. Contiene el contexto del proyecto y las instrucciones condensadas de todas las skills disponibles para que el agente las aplique **sin necesidad de leer los archivos de skill individualmente en cada chat**.

---

## 🗂️ Proyecto: HeavyMarket

- **Repositorio GitHub:** `https://github.com/wilfranr/heavymarket` (owner: `wilfranr`, repo: `heavymarket`)
- **Rama principal:** `main`
- **Stack Backend:** Laravel 13 API — directorio `heavy-api/`
- **Stack Frontend:** Angular 21 (Zoneless/Signals) — directorio `heavy-front/`
- **Entorno producción:** `https://heavymarket.net/`
- **Credenciales de prueba (browser):** usuario `wilfranr@gmail.com`, contraseña `896995`

---

## 🛠️ Protocolo de Operación (Harness Engineering)

El proyecto opera bajo un modelo de roles especializados gestionados mediante un grafo de dependencias (`.harness/dag.json`).

1. **Triage Agent:** Planifica y construye el DAG. No escribe código.
2. **Implementer:** Ejecuta nodos listos (`in_progress`). Usa Skills y valida localmente.
3. **Reviewer:** Gatekeeper. Valida contra checklists y cierra nodos (`done`).

**Regla de Oro:** Solo el **Reviewer** marca tareas como `done`. El **Implementer** debe atomizar tareas si superan 3 archivos o 150 líneas.

---

## 🧠 Memoria Persistente (Engram MCP)

Es **OBLIGATORIO** usar Engram para persistir decisiones y lecciones aprendidas.
- **Project:** Siempre usar `project: "heavymarket"`.
- **Topic Keys:** Usar claves como `arch/heavy-api-logic`, `arch/heavy-data-mapping`, `arch/heavy-ui-patterns`, `bugfix/*`, `decision/*`.
- **Lessons Learned:** Registrar fallos de linter o rechazos de revisión en `arch/heavy-audit-history`.

---

## 🤖 Skills Disponibles y Sus Instrucciones

El agente debe aplicar estas instrucciones de forma inmediata cuando detecte que la petición del usuario corresponde a alguna de las áreas descritas abajo.

---

### 1. 🐙 GitHub Issue Manager
**Cuándo aplicar:** gestionar el ciclo de vida de issues en el repositorio.
- **Comandos Clave:**
  - `gh issue list --repo wilfranr/heavymarket --state open --limit 50`
  - `gh issue view [NUMBER] --repo wilfranr/heavymarket --comments`
  - `gh issue create --repo wilfranr/heavymarket --title "[TITULO]" --body "[DESCRIPCION]"`
- **Reglas:** Usa siempre `--repo wilfranr/heavymarket`. Presenta listados en tablas. Pide confirmación antes de cerrar.

### 2. 🏗️ Software Architect
**Cuándo aplicar:** diseño de estructuras, patrones (SOLID/DRY) y flujos de datos.
- **Backend:** Services, Repositories, Resources (`heavy-api/app/`).
- **Frontend:** Features, Core, Store (Fachadas/Signals).
- **Visualización:** Generar diagramas **Mermaid.js** para flujos complejos. Usa representaciones de árbol para estructuras de archivos.

### 3. 🚀 DevOps & Deployment Pro
**Cuándo aplicar:** infraestructura, Docker y despliegue continuo.
- **Comandos:** `./scripts/deploy.sh` (opciones `--front` o `--api`).
- **Docker:** `docker-compose up -d`, `docker-compose logs -f`.
- **REGLA CRÍTICA:** Tras un `git pull` en servidor, es **OBLIGATORIO** ejecutar el script de despliegue para regenerar assets.

### 4. 🗄️ SQL Query Analyst
**Cuándo aplicar:** optimización de queries, diseño de esquemas y Eloquent.
- **Eloquent:** Tipado estricto, evita N+1 con `with()`. Usa `DB::transaction()` para atomicidad.
- **Migraciones:** `php artisan make:migration`, `php artisan migrate`.
- **Estándares:** Tablas en plural, campos en `snake_case`. Índices obligatorios en FKs y campos de búsqueda.

### 5. 📝 Tech Doc Expert
**Cuándo aplicar:** generar README, documentación de API (Scramble/OpenAPI) y manuales Markdown.
- **Estándares:** Idioma **ESPAÑOL**. Uso avanzado de Markdown. Incluir siempre el "por qué" de las decisiones técnicas.
- **Archivos:** `README.md`, `AGENTS.md`, `MIGRACIONES.md`.

### 6. 🧪 Testing Expert
**Cuándo aplicar:** estrategia de QA, validación manual y checklists.
- **Instrucciones:** Definir "Camino Feliz", "Camino con Errores" y "Casos de Borde".
- **Documentación:** Mantener actualizado `CHECKLIST_PRUEBAS.md`. Reportar bugs con pasos para reproducir.

### 7. 🎨 UI/UX Design Expert
**Cuándo aplicar:** interfaces con Angular, PrimeNG y TailwindCSS.
- **Estándares:** Usar componentes Standalone. **TailwindCSS** para layout (prohibido PrimeFlex).
- **Temas:** Soporte obligatorio para Dark/Light mode usando variables CSS (`var(--p-surface-border)`).
- **Referencia:** Consultar `src/app/features/listas/` como estándar de CRUD.

### 8. ✅ Automated Tester
**Cuándo aplicar:** validación automática tras cambios (Pest/PHPUnit/Playwright).
- **Backend:** `php artisan test`. Estructura **Arrange -> Act -> Assert**.
- **Frontend:** `npx playwright test`.
- **Autonomía:** Corregir errores detectados por los tests antes de reportar.

### 9. 📦 Commit Expert
**Cuándo aplicar:** mensajes de commit con **Conventional Commits**.
- **Formato:** `tipo(alcance): descripción en minúsculas` (feat, fix, docs, refactor, style).
- **Reglas:** Mensajes en **ESPAÑOL**. Commits atómicos. Referenciar issue `(fix #42)`.

---

## 📌 Notas Generales para el Agente

- El directorio de trabajo principal es `/home/yoseth/Dev/heavymarket`.
- Siempre usar rutas absolutas en las herramientas de archivo.
- Para comandos de solo lectura seguros, usar `SafeToAutoRun: true`.
- Para comandos que modifican estado del sistema o repositorio, usar `SafeToAutoRun: false`.
