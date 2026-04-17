# Diccionario de Datos - HeavyMarket

Este documento detalla las entidades principales del sistema, sus atributos clave y las relaciones que sostienen el flujo comercial de maquinaria pesada y repuestos.

## Entidades Principales

### 1. Terceros (`terceros`)
Es la entidad núcleo del sistema. Representa a cualquier actor comercial (Clientes, Proveedores, Fabricantes).
*   **Campos Clave**: `nombre`, `tipo_documento`, `numero_documento`, `tipo` (polimorfismo: Proveedor, Cliente, Ambos), `landing_access` (boolean).
*   **Relaciones**:
    *   `1:N` con `Contactos` y `Direcciones`.
    *   `N:M` con `Maquinas` (flota del cliente).
    *   `N:M` con `Sistemas` y `Fabricantes`.
    *   `1:N` con `Pedidos`.

### 2. Pedidos (`pedidos`)
Inicia el flujo comercial. Puede originarse desde la Landing Page o el Dashboard administrativo.
*   **Campos Clave**: `user_id`, `tercero_id`, `maquina_id`, `estado` (`Nuevo`, `En_Analisis`, `En_Costeo`, `Cotizado`, `Aprobado`, `Rechazado`, etc.).
*   **Relaciones**:
    *   `N:1` con `Tercero` (Cliente) y `Maquina`.
    *   `1:N` con `PedidoReferencia` (Líneas de detalle del pedido).
    *   `1:N` con `Cotizacion`.

### 2.1 Líneas de Pedido (`pedido_referencia`)
Representa cada ítem del pedido y concentra el contexto técnico de análisis.
*   **Campos Clave**:
    *   `pedido_id`
    *   `referencia_id` (vínculo técnico a catálogo de referencias)
    *   `sistema_id`
    *   `lista_id` (tipo de artículo)
    *   `definicion` (texto de captura/soporte cuando no hay referencia definitiva)
    *   `cantidad`, `comentario`, `estado`
*   **Relaciones**:
    *   `N:1` con `Pedido`
    *   `N:1` con `Referencia`
    *   `N:1` con `Sistema`
    *   `N:1` con `Lista` (tipo de artículo)

### 3. Artículos y Referencias (`articulos`, `referencias`)
El catálogo de productos se divide en Definiciones (Artículos) e Identificadores (Referencias).
*   **Articulo**: Contiene la definición técnica, fotos y descripción.
*   **Referencia**: Contiene el código o número de parte, marca y relación con el artículo.
    *   Soporta referencias **temporales** (`es_temporal`) para capturas iniciales cuando el código no existe en catálogo.
    *   Puede guardar comentario de trazabilidad del origen (por ejemplo, landing o pedido interno).
*   **Relaciones**:
    *   `N:M` entre `Articulos` y `Referencias` (vía `articulos_referencias`).
    *   `N:1` opcional de `Referencia` hacia `Articulo` por `articulo_id` (compatibilidad con modelo legado + pivote).
    *   `N:1` de `Referencia` hacia `Lista` (Marca/Fabricante).
    *   `N:1` de `Referencia` hacia `Categoria`.

### 4. Máquinas (`maquinas`)
Representa el equipo pesado asociado a los clientes.
*   **Campos Clave**: `modelo`, `serie`, `arreglo`, `tipo` (FK a listas), `fabricante_id` (FK a listas).
*   **Relaciones**:
    *   `N:M` con `Terceros` (Propietarios/Operadores).
    *   `1:N` con `Pedidos`.

### 5. Cotizaciones (`cotizaciones`)
Generadas a partir de un pedido después de un proceso de costeo.
*   **Campos Clave**: `pedido_id`, `total`, `estado`, `fecha_vencimiento`.
*   **Relaciones**:
    *   `N:1` con `Pedido` y `Tercero`.
    *   `1:N` con `CotizacionReferenciaProveedor` (Detalle de precios por proveedor).

## Tablas de Soporte (Listas)
El sistema utiliza una tabla genérica llamada `listas` para gestionar catálogos dinámicos:
*   Tipos de Máquina.
*   Marcas / Fabricantes.
*   Categorías Comerciales.
*   Tipos de Artículo.

## Flujo de Datos Comercial
1.  **Lead/Pedido**: Se registra un `Pedido` asociado a un `Tercero` y opcionalmente a una `Maquina`.
2.  **Captura/Análisis**: Se asocian `Referencias` y `Articulos` al pedido; si una referencia no existe, puede crearse temporalmente y luego ser validada por analista.
3.  **Costeo**: Se consultan proveedores (vía `PedidoReferenciaProveedor`).
4.  **Cotización**: Se consolida una `Cotizacion` con precios finales para el cliente.
5.  **Orden**: (Siguientes estados) `OrdenCompra` (hacia proveedor) y `OrdenTrabajo` (interna).

## Convención Funcional de Referencias

- **`referencia_id`**: vínculo técnico definitivo a `referencias`.
- **`definicion` en `pedido_referencia`**: texto operativo para captura manual y trazabilidad durante análisis.
- **`es_temporal` en `referencias`**: indica código provisional pendiente de validación técnica.
