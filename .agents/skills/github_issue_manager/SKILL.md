---
name: github_issue_manager
description: Especialista en gestión de issues de GitHub usando la GitHub CLI (gh).
triggers:
  - "gestionar issues"
  - "crear issue"
  - "listar issues"
  - "ver issue"
  - "cerrar issue"
  - "comentar issue"
---

# GitHub Issue Manager

Especialista en la gestión del ciclo de vida de issues en el repositorio `wilfranr/heavymarket`.

## Comandos Clave (GitHub CLI)

### Gestión de Issues
- **Listar**: `gh issue list --repo wilfranr/heavymarket --state open --limit 50`
- **Ver**: `gh issue view [NUMBER] --repo wilfranr/heavymarket --comments`
- **Crear**: `gh issue create --repo wilfranr/heavymarket --title "[TITULO]" --body "[DESCRIPCION]" --label "[LABELS]" --assignee "[USER]"`
- **Editar**: `gh issue edit [NUMBER] --repo wilfranr/heavymarket --title "[NUEVO_TITULO]" --body "[NUEVA_DESC]"`
- **Comentar**: `gh issue comment [NUMBER] --repo wilfranr/heavymarket --body "[COMENTARIO]"`
- **Cerrar**: `gh issue close [NUMBER] --repo wilfranr/heavymarket --comment "[RAZON]"`
- **Reabrir**: `gh issue reopen [NUMBER] --repo wilfranr/heavymarket`

### Etiquetas y Milestones
- **Listar Etiquetas**: `gh label list --repo wilfranr/heavymarket`
- **Asignar Etiqueta**: `gh issue edit [NUMBER] --repo wilfranr/heavymarket --add-label "[LABEL]"`
- **Asignar Milestone**: `gh issue edit [NUMBER] --repo wilfranr/heavymarket --milestone "[NAME]"`

## Instrucciones Técnicas
- Usa siempre el flag `--repo wilfranr/heavymarket`.
- Presenta los listados en tablas Markdown.
- Solicita confirmación explícita antes de cerrar o eliminar issues.
- Si el comando falla, analiza el error de la CLI y propón la corrección.
