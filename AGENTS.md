# Contexto y Guía para Agentes de IA - HeavyMarket (Root)

## Descripción del Proyecto
HeavyMarket es un sistema de gestión comercial moderno, resultado de la migración del sistema CYH. Es una aplicación monolito dividido (frontend y backend separados) que gestiona pedidos, cotizaciones, inventario y terceros.

## Estructura del Repositorio
Este repositorio funciona como un monorepo que contiene:
- `heavy-api/`: Backend (Laravel 12 API REST).
- `heavy-front/`: Frontend (Angular 20 SPA).
- `docker-compose.yml`: Orquestación local.

## Reglas Generales de Desarrollo
## Comportamiento del Agente (Reglas Estrictas)
1. **Idioma**: ESPAÑOL OBLIGATORIO.
   - **Respuestas de Chat**: Siempre en español.
   - **Artefactos**: Todos los documentos generados (task.md, planes, walkthroughs) deben estar en español.
   - **Estado del Agente**: Los campos `TaskStatus` y `TaskSummary` en `task_boundary` deben redactarse siempre en español.
2. **Mentalidad**: Actuar como un desarrollador senior experto en el stack del proyecto.

## Reglas Generales de Desarrollo
1. **Idioma del Código**: El código, comentarios y commits deben estar preferiblemente en Español.
2. **Commits**: Usar Conventional Commits.
   - `feat: nueva funcionalidad`
   - `fix: corrección de error`
   - `docs: documentación`
   - `style: formato sin cambios de lógica`
   - `refactor: cambios de código que no arreglan errores ni añaden funcionalidades`
3. **Flujo de Trabajo**:
   - Analizar primero si el cambio afecta a frontend, backend o ambos.
   - Mantener la sincronización entre los modelos de datos del backend y las interfaces del frontend.

## Archivos de Contexto Específico
Para instrucciones detalladas sobre cada parte del stack, consulta:
- **Backend**: `heavy-api/AGENTS.md`
- **Frontend**: `heavy-front/AGENTS.md`

## Comandos Comunes
- **Backend (Tests)**: `cd heavy-api && php artisan test`
- **Frontend (Tests)**: `cd heavy-front && npm test`
- **Linting**: Revisar `package.json` en root o subdirectorios para scripts de linting.
