# Contexto del Agente — HeavyMarket

Este archivo es leído automáticamente por Antigravity al inicio de cada conversación. Contiene el contexto del proyecto y las instrucciones condensadas de todas las skills disponibles para que el agente las aplique **sin necesidad de leer los archivos de skill individualmente en cada chat**.

---

## 🗂️ Proyecto: HeavyMarket

- **Repositorio GitHub:** `https://github.com/wilfranr/heavymarket` (owner: `wilfranr`, repo: `heavymarket`)
- **Rama principal:** `main`
- **Stack Backend:** Laravel (PHP) — directorio `heavy-api/`
- **Stack Frontend:** Angular — directorio `heavy-app/` o similar
- **Entorno producción:** `https://heavymarket.net/`
- **Credenciales de prueba (browser):** usuario `wilfranr@gmail.com`, contraseña `896995`

---

## 🤖 Skills Disponibles y Sus Instrucciones

El agente debe aplicar estas instrucciones de forma inmediata cuando detecte que la petición del usuario corresponde a alguna de las áreas descritas abajo. **No es necesario leer los archivos `.agent/skills/*/SKILL.md` nuevamente**, ya que su contenido está consolidado aquí.

---

### 1. 🐙 GitHub Issue Manager

**Cuándo aplicar:** cuando el usuario pide listar, ver, crear, editar, etiquetar, comentar o cerrar issues.

**Repositorio:** siempre usar `--repo wilfranr/heavymarket` en cada comando `gh`.

**Reglas:**
- Consultas de solo lectura → `SafeToAutoRun: true` (ejecutar sin pedir permiso).
- Crear, editar, comentar, etiquetar → `SafeToAutoRun: false` (mostrar resumen y proponer).
- Cerrar/reabrir → pedir confirmación explícita mostrando `#número` y título del issue.
- Presentar resultados en tablas markdown con columnas: `#`, `Título`, `Estado`, `Etiquetas`, `Asignado`, `Fecha`.

**Comandos clave:**
```bash
gh issue list --repo wilfranr/heavymarket --state open --limit 50 --json number,title,state,labels,assignees,createdAt
gh issue view <N> --repo wilfranr/heavymarket --comments --json number,title,state,labels,assignees,body,comments,createdAt,url
gh issue create --repo wilfranr/heavymarket --title "Título" --body "Descripción" --label "bug" --assignee "wilfranr"
gh issue edit <N> --repo wilfranr/heavymarket --title "Nuevo título"
gh issue edit <N> --repo wilfranr/heavymarket --add-label "bug,priority:high"
gh issue edit <N> --repo wilfranr/heavymarket --remove-label "wontfix"
gh issue comment <N> --repo wilfranr/heavymarket --body "Comentario"
gh issue close <N> --repo wilfranr/heavymarket --comment "Motivo del cierre"
gh issue reopen <N> --repo wilfranr/heavymarket --comment "Motivo de reapertura"
gh label list --repo wilfranr/heavymarket
gh label create "nombre" --repo wilfranr/heavymarket --color "e11d48" --description "Descripción"
```

---

### 2. 🏗️ Software Architect

**Cuándo aplicar:** diseño de arquitecturas, evaluación de patrones, estructuras de carpetas, diagramas de flujo.

**Protocolo:**
1. Analizar requisitos (velocidad, disponibilidad, mantenibilidad).
2. Seleccionar stack adecuado (Laravel: Contracts/Services; Angular: Standalone Components/Signals).
3. Describir capas y flujo de datos.
4. Proponer estrategia de manejo de excepciones.
5. Generar siempre un diagrama **Mermaid.js** para arquitecturas complejas.
6. Usar bloques de árbol para estructuras de carpetas.

**Principios:** SOLID, DRY, KISS. Patrones: Repository, Service Layer, Factory, Observer.

---

### 3. 🚀 DevOps Deployment Pro

**Cuándo aplicar:** configuración de Nginx, despliegue en Ubuntu, SSL con Certbot, PHP-FPM, builds de Vite/Angular.

**Protocolo:**
1. Diagnóstico: solicitar logs (`/var/log/nginx/error.log`, logs de Laravel).
2. Seguridad primero: recomendar backup antes de modificar configs.
3. Priorizar soluciones automatizadas (una sola línea).

**Comandos frecuentes:**
- `nginx -t` — verificar sintaxis
- `systemctl reload nginx` — recargar
- `chown -R www-data:www-data storage bootstrap/cache` — permisos Laravel

---

### 4. 🗄️ SQL Query Analyst

**Cuándo aplicar:** optimización de queries, diseño de esquemas, indexación, problemas de rendimiento en MySQL/SQL Server.

**Protocolo:**
1. Verificar sintaxis para el motor específico.
2. Reescribir la query para mejorar rendimiento.
3. Justificar por qué la nueva versión es más rápida.
4. Si la query es óptima pero lenta → sugerir índices o particionamiento.
5. Detectar problemas N+1 en Eloquent y proponer Eager Loading.

**Formato de índice:** `CREATE [UNIQUE] INDEX idx_nombre ON tabla (col1, col2);`

---

### 5. 📝 Tech Doc Expert

**Cuándo aplicar:** generar README, documentar APIs, comentarios PHPDoc/JSDoc, diagramas de flujo técnicos.

**Protocolo:**
1. Auditar el stack (Laravel, Angular, etc.) para adaptar instrucciones.
2. Usar H1/H2/H3 y listas claras.
3. Bloques de código con lenguaje resaltado.
4. Añadir guía de contribución si el proyecto es colaborativo.

**Estándares:** README con secciones (descripción, requisitos, instalación, uso, tecnologías, licencia). APIs en OpenAPI/Swagger YAML o JSON.

---

### 6. 🧪 Testing Expert

**Cuándo aplicar:** tests unitarios, integración, E2E para Laravel (Pest/PHPUnit), Angular (Jasmine/Karma/Cypress), Flutter.

**Protocolo (AAA):**
- **Arrange:** Configurar escenario, mocks, factories.
- **Act:** Ejecutar la lógica a probar.
- **Assert:** Verificar resultados esperados.

Siempre sugerir casos de borde (nulos, errores de red, datos inesperados). Priorizar TDD: ciclo Red → Green → Refactor.

---

### 7. 🎨 UI/UX Design Expert

**Cuándo aplicar:** mejorar interfaces, paletas de colores, CSS/Tailwind, accesibilidad, diseño responsivo.

**Principios:**
- Jerarquía visual con fuentes y colores.
- White space generoso.
- Contraste WCAG.
- Siempre diseñar para modo claro Y oscuro.

**Protocolo:**
1. Analizar UI actual (contraste, alineación, saturación).
2. Proponer estética (Minimalista, SaaS moderno, Glassmorphism, etc.).
3. Entregar HTML/CSS/Tailwind listo para copiar.
4. Validar accesibilidad.

---

### 8. ✅ Automated Tester

**Cuándo aplicar:** después de CADA cambio de código implementado, corrección de bug o nueva funcionalidad.

**Reglas críticas:**
- **Autonomía total**: iniciar `browser_subagent` proactivamente SIN pedir permiso al usuario.
- **Auto-corrección**: si el test falla → investigar código → aplicar fix → volver a probar. No solo reportar el error.
- **Ciclo:** Probar → Corregir → Volver a probar. Solo detener si hay bloqueo estructural complejo que requiera consulta al usuario.

**Flujo:**
1. Identificar qué probar según el cambio.
2. Escribir `Task` detallado para `browser_subagent` con URL, credenciales (`wilfranr@gmail.com` / `896995`), pasos y condición de éxito.
3. Analizar resultado.
4. Corregir si hay errores y repetir.
5. Reportar al usuario con resumen de prueba, errores encontrados y cómo se mitigaron.

---

### 9. 📦 Commit Expert

**Cuándo aplicar:** al redactar mensajes de commit.

**Formato:** `<tipo>(<alcance>): <descripción corta en minúsculas>`

**Tipos permitidos:**
- `feat` — Nueva característica
- `fix` — Corrección de error
- `docs` — Cambios en documentación
- `style` — Formato (espacios, comas, etc.)
- `refactor` — Cambio de código que no arregla error ni añade función

---

## 📌 Notas Generales para el Agente

- El directorio de trabajo principal es `/home/yoseth/Dev/heavymarket`.
- Siempre usar rutas absolutas en las herramientas de archivo.
- Para comandos de solo lectura seguros, usar `SafeToAutoRun: true`.
- Para comandos que modifican estado del sistema o repositorio, usar `SafeToAutoRun: false`.
