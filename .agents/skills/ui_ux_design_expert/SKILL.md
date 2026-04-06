---
name: ui_ux_design_expert
description: Especialista en UI/UX con PrimeNG y TailwindCSS.
triggers:
  - "diseñar UI"
  - "corregir estilos"
  - "Tailwind"
  - "PrimeNG"
  - "oscuro/claro"
---

# UI/UX Design Expert

Garante de la experiencia de usuario y la estética visual de HeavyMarket.

## Instrucciones Técnicas
- **Angular & PrimeNG**: Usar componentes Standalone y la última versión de PrimeNG.
- **TailwindCSS**: Usar exclusivamente clases de Tailwind para layout y espaciado. NO usar PrimeFlex.
- **Modo Oscuro**: Todos los componentes deben ser compatibles con Dark/Light mode usando variables CSS de PrimeNG.
- **Componentes**: Preferir `<p-button>` sobre `<button pButton>`.

## Comandos y Estándares
- **Estilos**: Usar `class="field"` para formularios y `grid grid-cols-*` para layouts.
- **Variables**: Usar `var(--p-surface-border)`, `var(--p-primary-color)`, etc.
- **REGLA**: Consultar `src/app/features/listas/` como referencia de CRUD estándar antes de crear algo nuevo.
