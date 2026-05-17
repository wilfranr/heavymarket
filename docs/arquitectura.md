# Arquitectura del Sistema - HeavyMarket

El sistema HeavyMarket sigue un patrón de arquitectura desacoplada, separando completamente la lógica de negocio y persistencia (Backend) de la interfaz de usuario (Frontend).

## 1. Backend (heavy-api)
Construido con **Laravel 13**, enfocado en proporcionar una API REST robusta y segura.

*   **Autenticación**: Utiliza **Laravel Sanctum** para tokens API.
*   **Estructura de API**:
    *   `Routes`: Definidas en `api.php` bajo la versión `/v1/`.
    *   `Controllers`: Ubicados en `app/Http/Controllers/Api/V1/`, siguiendo el estándar de controladores de API.
    *   `Resources`: Uso de API Resources para respuestas JSON consistentes.
*   **Capa de Datos**:
    *   **Eloquent ORM**: Para la interacción con la base de datos MySQL 8+.
    *   **Traits**: Uso de `NormalizesResources` para estandarizar el formato de textos en los modelos.
*   **Seguridad**: Middleware `auth:sanctum` y autorización por roles (Administrador, super_admin, Vendedor, Analista, Logística).

## 2. Frontend (heavy-front)
Construido con **Angular 21**, diseñado como una Single Page Application (SPA) modular y escalable bajo una arquitectura **Zoneless**.

*   **Arquitectura Reactiva**: Uso nativo de **Signals** para la gestión de estado reactivo y detección de cambios eficiente. Se prioriza el uso de `signal`, `computed` y `effect` sobre RxJS para el estado de componentes.
*   **Gestión de Estado**: El proyecto está en migración total hacia **Signals**. El uso de NgRx está deprecado y solo se mantiene en módulos antiguos hasta su refactorización definitiva.
*   **Estructura de Directorios**:
    *   `core/`: Servicios globales, guardias de autenticación e interceptores.
    *   `shared/`: Componentes, directivas y pipes reutilizables.
    *   `features/`: Módulos de negocio (Pedidos, Terceros, Cotizaciones) cargados mediante **Lazy Loading**.
*   **UI Framework**: Utiliza **PrimeNG 18+** y **Tailwind CSS 4+** para una interfaz moderna, responsive y con soporte completo para temas (oscuro/claro).
*   **Comunicación API**: Implementada a través de `ApiService` que centraliza las peticiones HTTP hacia el backend de Laravel.

## 3. Flujo de Referencias (Diseño Actual)

El flujo de captura de referencias en pedidos es híbrido para soportar operación comercial y calidad técnica:

1. En crear/editar pedido, el asesor usa campo con autocompletado.
2. Si existe coincidencia, se asocia `referencia_id`.
3. Si no existe, se crea referencia temporal (`es_temporal = true`) y se conserva trazabilidad por comentario de origen.
4. El analista valida la referencia en fase de análisis antes de costeo.

### Relación de datos usada para búsqueda por tipo

- Selección de tipo de artículo (`pedido_referencia.lista_id`) -> resolución de `articulo_id`.
- Búsqueda de referencias por artículo considerando:
  - FK directa: `referencias.articulo_id`.
  - Relación pivote: `articulos_referencias`.
- Fallback global por código cuando no hay coincidencias por artículo, para no bloquear captura.

## 4. Integración y Despliegue
*   **Protocolo**: Comunicación puramente JSON sobre HTTPS.
*   **CORS**: Configurado en el backend para permitir peticiones solo desde dominios autorizados.
*   **Almacenamiento**: Las imágenes de maquinaria y repuestos se gestionan a través del sistema de archivos de Laravel (`storage`), expuesto mediante enlaces simbólicos hacia `public/storage`.

## 5. Diagrama de Flujo de Alto Nivel
```mermaid
graph LR
    subgraph Cliente
        Angular[Angular SPA]
    end
    subgraph Servidor
        Laravel[Laravel API]
        DB[(MySQL)]
        Storage[Filesystem Storage]
    end
    Angular -- JSON/HTTPS --> Laravel
    Laravel -- Eloquent --> DB
---

## 🛠️ Mapa de Implementación (Infraestructura Core)

Para entender los cimientos técnicos de HeavyMarket, consulte:

1. **La Base (API REST)**: `heavy-api/app/Http/Controllers/Controller.php` (Lógica base de controladores).
2. **La Seguridad (Auth)**: `heavy-api/app/Models/User.php` (Roles y permisos Spatie).
3. **El Motor UI (Front)**: `heavy-front/src/app/core/services/api.service.ts` (Centralización de peticiones HTTP con Signals).
4. **El Estilo (Layout)**: `heavy-front/src/app/layout/` (Estructura visual de la SPA).
5. **El Puente (CORS/Proxy)**: `heavy-front/proxy.conf.json` (Comunicación entre dev server y backend).

---
*Última actualización: 17 de Mayo, 2026*
