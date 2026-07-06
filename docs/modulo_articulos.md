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

---

## Issue: medidas técnicas con valor numérico

### Objetivo funcional
El campo `valor` en las medidas técnicas de los artículos debe ser numérico estricto. Actualmente es tratado como string en base de datos, backend y frontend. Dado que este valor se renderiza y gestiona en múltiples modales y componentes, se debe garantizar consistencia de tipo para evitar errores de cálculo o inconsistencias visuales en el monorepo.

### Decisión técnica de Triage
- **Base de Datos**: Crear una migración en Laravel que altere la columna `valor` en la tabla `medidas` para cambiar su tipo de `string` a `decimal(10, 4)`. Se mantendrá nullable.
- **Backend (API)**:
  - Modificar las reglas de validación en `ArticuloController@addMedida` y `ArticuloController@updateMedida` para que `valor` pase de ser `string` a `numeric`.
  - Asegurar la compatibilidad con el JSON string recibido en `store` de `ArticuloController`.
- **Frontend (DTO)**:
  - Cambiar el tipo de `valor` de `string` a `number` en la interfaz `Medida` de `heavy-front/src/app/core/models/articulo.model.ts`.
- **Frontend (UI Components)**:
  - Modificar la inicialización del objeto `medidaData` en `create.ts`, `edit.ts`, `articulo-create-modal.component.ts` y `articulo-edit-modal.component.ts` para que `valor` no sea un string vacío `''` sino `null`.
  - Reemplazar el elemento `<input pInputText>` por `<p-inputNumber>` para capturar la medida en `create.html`, `edit.html`, `articulo-create-modal.component.html` y `articulo-edit-modal.component.html`.
  - Utilizar parámetros de PrimeNG como `[showButtons]="false"`, `[min]="0"`, `mode="decimal"` y limitar los decimales con `[minFractionDigits]="2"` y `[maxFractionDigits]="4"` para dar flexibilidad técnica según el tipo de medida.
- **Validación / Tests**:
  - Ajustar las pruebas unitarias existentes (como `edit.spec.ts`) para proveer valores numéricos reales en lugar de strings de prueba.
  - Asegurar que todos los gates locales de backend y frontend sigan pasando (PHPUnit y Vitest/Karma).

### Nodos planificados en Harness
- `medidas-numeric-triage-doc`: Documentar alcance y grafo de dependencias para el valor numérico en medidas técnicas.
- `medidas-numeric-backend-migration`: Crear y ejecutar la migración Laravel que modifica la columna `valor` en la tabla `medidas`.
- `medidas-numeric-backend-validation`: Modificar las reglas de validación en los endpoints de medidas del controlador de artículos.
- `medidas-numeric-frontend-interface`: Cambiar el tipo de dato de `valor` a `number` en la interfaz TypeScript `Medida`.
- `medidas-numeric-frontend-components`: Implementar el control de entrada `p-inputNumber` en todos los formularios y modales correspondientes y adaptar su lógica.
- `medidas-numeric-tests`: Adaptar los tests unitarios en frontend y backend para contemplar la tipificación numérica.

---

## Issue: edición en línea para medidas técnicas (Inline Editing)

### Objetivo funcional
En la pantalla de creación e inicio de edición de artículos, se debe reemplazar el diálogo modal de medidas por una edición en línea en la propia tabla, utilizando el mismo patrón visual y funcional que las referencias cruzadas. El botón "Añadir Medida" debe insertar una nueva fila editable en la tabla. Un icono de lápiz debe permitir editar filas existentes directamente en la tabla sin modales ni salir de la vista.

### Decisión técnica de Triage
- **UI/UX**: Reemplazar `<p-dialog>` por inputs interactivos directamente en las celdas de la tabla de medidas. Esto aplica para `create.html` y `edit.html`.
- **Estructura temporal en Creación**: En `create.ts`, utilizar el array plano `medidasLocales` con variables auxiliares `editingMedidaIndex: number | null` y `medidaData: any` para rastrear qué elemento se está editando en línea.
- **Estructura temporal en Edición**: En `edit.ts`, usar `articuloActual.medidas` y agregar nuevos elementos locales con IDs temporales negativos (ej: `-1`, `-2`). Esto permite diferenciar registros de BD (ID > 0) de nuevos registros (ID < 0) al pulsar el botón "Guardar" de la fila, que llamará a `articuloService.addMedida` (nuevos) o `articuloService.updateMedida` (existentes).
- **Mapeo de inputs**: Usar `<input pInputText>` para `identificador`, `<p-dropdown>` para `tipo` y `unidad` (enlazados a sus respectivos catálogos de listas), y `<p-inputNumber>` para `valor` con precisión decimal.
- **Acciones Rápidas**: El botón `+` en las filas editables para agregar un nuevo Tipo o Unidad de Medida se conserva para abrir el modal genérico de creación rápida de listas.

### Nodos planificados en Harness
- `art-medidas-inline-triage`: Documentar alcance de la edición en línea para medidas y el plan de dependencias.
- `art-medidas-inline-create`: Frontend: Implementar la edición en línea de medidas en creación de artículos.
- `art-medidas-inline-edit`: Frontend: Implementar la edición en línea de medidas en edición de artículos.
- `art-medidas-inline-tests`: QA/Pruebas: Cobertura de regresión de los componentes y suite de pruebas unitarias.

---

## Issue: Mejorar la UX del select de Tipo y Unidad de Medida en edición en línea (Filtro emptyfilter)

### Objetivo funcional
Para optimizar el espacio de las columnas en la tabla de medidas técnicas y mejorar la UX de los catálogos rápidos (Tipo de Medida y Unidad de Medida), se eliminará el botón "+" externo de la fila. En su lugar, cuando el usuario busque un término en el filtro de búsqueda del select (`p-select`) y este no exista en el catálogo actual, se presentará una opción especial dentro del panel desplegable (emptyfilter) que permitirá crear el término buscado. Al pulsar dicha opción, se abrirá el modal de creación rápida con el nombre del término ya pre-diligenciado.

### Decisión técnica de Triage
- **Parámetro nombreDefault**: Habilitar en `app-lista-create-modal` (en [lista-create-modal.component.ts](file:///home/yoseth/dev/heavymarket/heavy-front/src/app/shared/components/lista-create-modal/lista-create-modal.component.ts)) el input `@Input() nombreDefault: string = '';` y usarlo para inicializar el formulario de creación rápida.
- **Captura del término filtrado**: En [create.ts](file:///home/yoseth/dev/heavymarket/heavy-front/src/app/features/articulos/create/create.ts) y [edit.ts](file:///home/yoseth/dev/heavymarket/heavy-front/src/app/features/articulos/edit/edit.ts), implementar métodos para almacenar el término actual ingresado por el usuario en el filtro de búsqueda del select (ej: `currentSearchTipoMedida` y `currentSearchUnidadMedida`).
- **Template de emptyfilter**: En [create.html](file:///home/yoseth/dev/heavymarket/heavy-front/src/app/features/articulos/create/create.html) y [edit.html](file:///home/yoseth/dev/heavymarket/heavy-front/src/app/features/articulos/edit/edit.html), agregar el `<ng-template pTemplate="emptyfilter">` a cada uno de los selectores desplegables `p-select` de la fila editable de medidas. Dicho template mostrará un botón para crear la opción no encontrada.
- **Limpieza de UI**: Remover la columna o elementos que contienen el botón `+` externo en las celdas de la tabla para las columnas de Tipo y Unidad de Medida.

### Nodos planificados en Harness
- `art-medidas-select-ux-triage`: Planificar la integración de la creación rápida de catálogos dentro del select y pre-diligenciado en el modal.
- `art-medidas-select-ux-impl`: Implementar el parámetro `nombreDefault` en el modal y la integración de `emptyfilter` en las pantallas de creación y edición.
- `art-medidas-select-ux-tests`: Pruebas de integración visual, unitarias y compilación del frontend.

