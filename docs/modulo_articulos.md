# Módulo de Artículos y Catálogo Técnico

Este módulo es el núcleo de conocimiento técnico de HeavyMarket. Su objetivo es gestionar de manera estructurada los repuestos, sus equivalencias, composiciones y especificaciones físicas.

## 1. Conceptos Fundamentales

### Artículos vs. Referencias
Para mantener la integridad de los datos y evitar duplicidad de información técnica, el sistema utiliza una separación clara:

*   **Artículo (Ficha Técnica)**: Representa el "ser" del producto. Contiene la definición (ej. "Bomba de Agua"), descripción detallada, peso y archivos multimedia (fotos/planos).
*   **Referencia (Identificador Comercial)**: Representa el "código" con el que se transacciona. Un mismo artículo puede tener múltiples referencias asociadas (ej. la referencia original de Caterpillar y una alternativa de marca CTP).

### Piezas Estándar
Los artículos se categorizan según una lista maestra llamada **Piezas Estándar**. Al crear un artículo, se debe seleccionar una definición de esta lista. Esto permite:
1.  Estandarizar nombres técnicos.
2.  Facilitar la búsqueda por grupos funcionales.
3.  Normalizar el catálogo legacy.

## 2. Estructura de Datos (Diccionario Detallado)

### Tabla `articulos`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | BigInt | Identificador único. |
| `definicion` | String | Nombre técnico (FK conceptual a Listas: Pieza Estándar). |
| `descripcionEspecifica`| Text | Detalles técnicos adicionales. |
| `peso` | Decimal | Peso en KG (usado para costeo de fletes). |
| `fotoDescriptiva` | String | Ruta al archivo de imagen principal. |
| `foto_medida` | String | Ruta al archivo de plano/diagrama técnico. |

### Tabla `referencias`
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | BigInt | Identificador único. |
| `referencia` | String | Código alfanumérico único. |
| `marca_id` | BigInt | Vínculo a la marca (Lista). |
| `es_temporal` | Boolean | `true` si fue creada durante un pedido y no ha sido validada. |

### Tabla Pivot `articulos_referencias`
Permite la relación **Muchos a Muchos** entre artículos y referencias. Una referencia puede pertenecer a un artículo principal, pero también ser equivalente de otros.

## 3. Funcionalidades Especiales

### Juegos (Kits) - `articulo_juegos`
Permite que un artículo sea definido como un conjunto de otros componentes. 
- **Estructura**: `articulo_id` (Padre) + `referencia_id` (Componente) + `cantidad`.
- **Uso**: Útil para "Kits de Empaquetadura" o "Juegos de Rodamiento" donde se requiere saber exactamente qué piezas integran el conjunto.

### Medidas Técnicas - `medidas`
Almacena dimensiones críticas para asegurar la compatibilidad.
- **Campos**: `identificador` (A, B, C...), `nombre` (Largo, DI, DE), `valor` y `unidad`.
- **Visualización**: En el frontend, estas medidas se superponen o se asocian a la `foto_medida` para una validación visual rápida.

### Conversor de Pesos
La interfaz de usuario incluye un componente especializado que permite ingresar pesos en **Gramos (g)**. El sistema realiza la conversión automática a **Kilogramos (kg)** antes de persistir el dato, asegurando que el módulo de costeo internacional opere sobre una unidad de medida estandarizada.

## 4. Flujo Operativo de Referencias Cruzadas
1.  **Captura**: El usuario busca una referencia.
2.  **Asociación**: Si la referencia ya existe, puede ver a qué `Artículo` está vinculada.
3.  **Equivalencia**: El usuario puede agregar múltiples referencias a un mismo artículo, creando automáticamente una red de equivalencias técnicas (cross-references).

---


## Issue: listado de artículos con referencias de cruce

### Objetivo funcional
En el listado de artículos se debe dejar de mostrar la columna **Pieza estándar** y, en su lugar, mostrar un campo calculado con la concatenación de las referencias de cruce asociadas al artículo. El buscador del listado también debe filtrar por ese nuevo campo.

### Decisión técnica de Triage
- **Campo visual**: calcular en frontend una cadena a partir de `articulo.referencias[].referencia`, eliminando duplicados y separando por `, `.
- **Contrato API**: reutilizar la relación `referencias` que ya expone `ArticuloResource` cuando el listado carga `referencias` y `referenciasDirectas`. No se requiere migración ni un nuevo campo persistido.
- **Búsqueda backend**: extender `ArticuloController@index` para que `search` incluya `whereHas` sobre `referencias` y `referenciasDirectas` por el campo `referencia`, manteniendo la búsqueda existente por `definicion` y `descripcionEspecifica`.
- **UI**: reemplazar encabezado y celda de `Pieza estándar` por `Referencias de cruce`, conservando layout responsive y tema claro/oscuro sin colores hardcodeados nuevos.

### Nodos planificados en Harness
- `art-list-refcruce-triage`: documentar alcance y dependencias.
- `art-list-refcruce-backend-search`: ampliar filtro `search` de artículos para referencias directas y por pivote.
- `art-list-refcruce-frontend-column`: reemplazar columna visible y helper de concatenación en el listado Angular.
- `art-list-refcruce-tests`: cubrir backend y frontend.

## 🛠️ Mapa de Implementación (Anclas Técnicas)

Para entender este flujo de manera quirúrgica, el agente debe consultar estos archivos en orden:

1. **El Contrato (Backend Model)**: `heavy-api/app/Models/Articulo.php` (Define campos de ficha técnica, fotos y pesos).
2. **El Cerebro (API Controller)**: `heavy-api/app/Http/Controllers/Api/V1/ArticuloController.php` (Lógica de validación y almacenamiento).
3. **El Transporte (Frontend DTO)**: `heavy-front/src/app/core/models/articulo.model.ts` (Estructura de datos en TypeScript).
4. **La Fachada (Frontend Service)**: `heavy-front/src/app/core/services/articulo.service.ts` (Comunicación mediante Signals).
5. **La Interacción (Feature UI)**: `heavy-front/src/app/features/listas/` (Utilizado como CRUD de referencia para la gestión de definiciones técnicas).
