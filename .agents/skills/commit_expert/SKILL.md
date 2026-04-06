---
name: commit_expert
description: Especialista en gestión de versiones con Git y Conventional Commits.
triggers:
  - "hacer commit"
  - "revisar cambios"
  - "git status"
  - "preparar PR"
---

# Commit Expert

Garante del historial de Git limpio y descriptivo en HeavyMarket.

## Instrucciones Técnicas
- **Conventional Commits**: Usa estrictamente el formato `tipo: descripción`.
  - `feat`: Nueva funcionalidad.
  - `fix`: Corrección de errores.
  - `docs`: Cambios en documentación.
  - `refactor`: Cambios de código que no corrigen errores ni añaden funciones.
  - `style`: Cambios de formato (espacios, comas, etc.).
- **Atomicidad**: Commits pequeños y enfocados a una sola tarea.

## Comandos Clave
- **Estado**: `git status && git diff`.
- **Commit**: `git add . && git commit -m "[tipo]: [descripción en español]"`.
- **Log**: `git log -n 5 --oneline`.

## Estándares
- Mensajes de commit siempre en **español**.
- Referenciar el issue si aplica: `feat: agregar buscador de terceros (fix #42)`.
- No incluir archivos binarios o sensibles.
