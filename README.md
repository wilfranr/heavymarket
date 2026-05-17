# HeavyMarket

Sistema de gestión comercial moderno construido con **Laravel 13** y **Angular 21 (Zoneless)**.

## 🚀 Portal de Documentación

Esta es la puerta de entrada al ecosistema de HeavyMarket. Para mantener la coherencia técnica, consulte los manuales específicos:

### 1. Guías de Desarrollo y Operación
- [**GEMINI.md**](./GEMINI.md): Mandatos críticos, orquestación de agentes y reglas de oro del proyecto.
- [**Protocolo de Agentes**](./.agents/AGENT.md): Instrucciones detalladas para las Skills (Software Architect, SQL, UI/UX, etc.) y modelo de arneses.
- [**CHECKLIST_PRUEBAS.md**](./CHECKLIST_PRUEBAS.md): Protocolos de QA y validación manual.

### 2. Documentación Técnica (Backend)
- [**Setup del Backend**](./heavy-api/README.md): Instalación y configuración de Laravel 13.
- [**Documentación de la API**](./heavy-api/API_DOCUMENTATION.md): Guía de endpoints y documentación interactiva vía **Scramble**.
- [**Gestión de Migraciones**](./heavy-api/MIGRACIONES.md): Evolución del esquema de base de datos desde el legacy CYH.

### 3. Documentación Técnica (Frontend)
- [**Setup del Frontend**](./heavy-front/README.md): Instalación y configuración de Angular 21.
- [**Estándares de Frontend**](./heavy-front/README_HEAVYMARKET.md): Guía oficial de UI/UX (PrimeNG 21 + Tailwind 4), Signals y arquitectura Zoneless.
- [**Guía de Agentes (Front)**](./heavy-front/AGENTS.md): Mejores prácticas de implementación UI y manejo de formularios.

### 4. Especificaciones Funcionales
- [**Arquitectura del Sistema**](./docs/arquitectura.md): Diagramas de flujo y diseño estructural.
- [**Especificación Funcional**](./docs/especificacion_funcional.md): Reglas de negocio y alcance del sistema.
- [**Diccionario de Datos**](./docs/diccionario_datos.md): Entidades y relaciones principales.
- [**Módulo de Pedidos**](./docs/modulo_pedidos.md): Gestión comercial, TRM y flujo de cotización.
- [**Módulo de Artículos**](./docs/modulo_articulos.md): Gestión de catálogo técnico y repuestos.
- [**Órdenes de Trabajo**](./docs/modulo_ordenes_trabajo.md): Flujo logístico y semaforización.
- [**Portal de Proveedores**](./docs/portal_proveedores.md): Guía del módulo de costeo colaborativo.

---

## 🛠️ Estructura del Proyecto

```
heavymarket/
├── heavy-api/          # Backend API REST (Laravel 13)
├── heavy-front/        # Frontend SPA (Angular 21 + PrimeNG 21)
├── docs/               # Manuales funcionales y técnicos
│   └── archive/       # Historial de progreso y migración
└── scripts/            # Automatización de despliegue y DevOps
```

## 🏗️ Modelo de Trabajo (Harness Engineering)

El proyecto opera bajo un modelo de roles especializados:
1. **Triage Agent**: Planificación mediante grafos de dependencias (`.harness/dag.json`).
2. **Implementer**: Ejecución técnica y validación local.
3. **Reviewer**: Gatekeeper de calidad y cierre de tareas.

---

## 📦 Despliegue Rápido

Para desplegar cambios en el servidor tras un `git pull`:

```bash
./scripts/deploy.sh
```

---
**Última Auditoría de Documentación:** 17 de Mayo, 2026  
**Estado:** ✅ 100% Sincronizada con el código real.
