# Documento de Requisitos del Producto (PRD) - Heavy Market

## 1. Visión General del Producto

Heavy Market es un ecosistema digital Multi-Tenant que integra un SaaS de gestión de mantenimiento (CMMS) para flotas de maquinaria pesada con un Marketplace B2B transaccional y un módulo interno de Broker de importaciones.

**Modelo de Negocio Core:** Retención del cliente mediante herramientas de gestión interna (flujos de aprobación y control de horómetros) y monetización a través de comisiones transaccionales a proveedores externos o márgenes de intermediación (Broker) en compras locales e importaciones.

## 2. Arquitectura Multi-Tenant y Permisos (RBAC)

### Organización A: Cliente (Propietario de la Flota)

- **Gestor de Maquinaria (Comprador):** Crea perfiles de máquinas. Levanta requerimientos (manuales, drill-down o carga masiva). Revisa las ofertas recibidas en el comparador, selecciona los repuestos y genera la Orden de Trabajo (OT), que a su vez dispara a que el sistema genere las órdenes de compra correspondientes.
- **Gerente (Aprobador):** Filtro financiero. Revisa la OC generada por el sistema y la aprueba o rechaza. No interactúa con búsquedas ni cruces técnicos.
- **Contador:** Recibe las OC aprobadas. Realiza los pagos externos y sube los comprobantes bancarios al sistema.
- **Almacenista:** Operador de inventario. Confirma la recepción física de la mercancía para cerrar el ciclo de compra del proveedor e ingresa los repuestos al Inventario de Transición. Posteriormente, genera las Remisiones de Salida hacia los mecánicos.

### Organización B: Proveedor (Vendedor Externo)

- **Vendedor:** Cotiza las solicitudes (RFQs) con precio, marca y tiempo de entrega. Al recibir una OC, separa y confirma disponibilidad de stock.
- **Facturador:** Revisa el comprobante de pago subido por el cliente y emite/adjunta la factura electrónica.
- **Logística:** Alista la mercancía, asigna la transportadora y el número de guía, y actualiza la orden a estado "Despachado".

### Organización C: Heavy Market (Operación Interna & Broker)

- **Analista Técnico (Curador):** Recibe el requerimiento crudo, cruza referencias maestras, adjunta diagramas, determina si es un kit y asigna categorías comerciales (Ej. Motor, Misceláneos). No ve precios ni emite OCs. Su acción dispara el envío masivo de RFQs.
- **Vendedor Interno (Broker):** Actúa como proveedor proxy. Recibe RFQs y utiliza una calculadora omnicanal (costo base + flete + arancel + utilidad) para ofertar repuestos importados o de proveedores locales.
- **Gerente (HM):** Aprueba las OCs Internas de compras generadas por el Vendedor Broker (flujo Back-to-Back).
- **Contabilidad (HM):** Paga las compras al proveedor origen y factura las ventas al Cliente Final.
- **Logística (HM):** Recibe la mercancía del proveedor origen, la verifica y la despacha al Cliente Final.

## 3. Máquina de Estados (Ciclo de Vida del Pedido)

El sistema impone un avance lineal inmutable para garantizar la trazabilidad de cada repuesto:

1. **DRAFT:** Gestor arma el pedido.
2. **PENDING_ANALYSIS:** Analista (HM) cruza referencias y cataloga.
3. **RFQ_BROADCAST:** Sistema notifica a Proveedores (Org B) y Vendedor Broker (Org C).
4. **QUOTING:** Proveedores envían ofertas.
5. **READY_FOR_REVIEW:** Gestor compara y genera la OT y OCs.
6. **PO_STOCK_CHECK:** Logística certifica stock y separa mercancía de OCs.
7. **PO_PENDING_APPROVAL:** Gerente aprueba financieramente las OCs.
8. **PAYMENT_UPLOADED:** Contador sube soporte de pago.
9. **INVOICED:** Proveedor emite factura.
10. **SHIPPED:** Proveedor despacha mercancía con guía.
11. **DELIVERED:** Almacenista recibe caja. Proveedor finaliza su ciclo.
12. **IN_STOCK:** Repuestos entran a (Inventario de Transición).
13. **INSTALLED (Cierre CMMS):** Almacenista despacha la pieza al mecánico mediante Remisión de Salida.

## 4. Módulo SaaS: Inventario de Transición y CMMS Lite

Al recibir la mercancía (DELIVERED), el sistema aísla los ítems en un Inventario de Transición. La activación de la vida útil del repuesto exige un protocolo estricto de entrega en campo:

**Generación de Remisión de Salida:** Para trasladar un repuesto del estado `IN_STOCK` a `INSTALLED`, el Almacenista debe completar un formulario que requiere:

- **Validación de Máquina:** Confirmar o reasignar la máquina de destino final.
- **Horómetro de Instalación:** Campo numérico (Integer/Float) obligatorio.
- **Evidencia Fotográfica:** Carga obligatoria de archivo/foto del tablero de la máquina marcando el horómetro.
- **Responsable de Horómetro:** Campo de texto obligatorio con el nombre del mecánico u operador que suministra la información de las horas de la máquina.

> **Nota de Backend:** Estos cuatro datos alimentan la tabla `Machine_Ledger`, la cual calculará el Costo por Hora (CPH) cuando la pieza sea reemplazada en el futuro.

## 5. Diseño Modular de Interfaz (Widgets por Rol)

El frontend mantendrá una estructura única de `/dashboard` con renderizado condicional de componentes:

### Org A

- **Gestor:** "Pedidos en Borrador", "Comparativos de cotizaciones", "Ordenes de Trabajo en curso" y "Ordenes de Trabajo finalizadas".
- **Gerente:** "Órdenes de Compra Pendientes de Aprobación", "Órdenes de Compra Aprobadas", "KPIs financieros" y "Estadísticas maquinaria".
- **Contador:** "Órdenes Aprobadas Pendientes de Pago", "Ordenes por recibir facturas" y "Ordenes Completadas".
- **Almacenista:** "Recepciones en Tránsito", "Ordenes Recibidas", "Inventario de Transición" y "Remisiones Generadas".

### Org B

- **Vendedor:** "Nuevos Requerimientos a Cotizar", "Órdenes de Compra en Curso" y "Órdenes de Compra entregadas".
- **Facturador:** "Pagos a Verificar", "Pagos Verificados", "Órdenes por Facturar" y "Ordenes Facturadas".
- **Logística:** "Confirmar Stock", "Órdenes por Despachar" y "Ordenes Despachadas".

### Org C

- **Analista Técnico (HM):** "Pedidos por Analizar" y "Pedidos Analizados".
- **Vendedor Broker (HM):** "Cotizador Omnicanal (Broker)".
- **Gerente (HM):** "Órdenes de Compra Pendientes de Aprobación", "Órdenes de Compra Aprobadas" y "Negocios de plataforma".
- **Contabilidad (HM):** "Órdenes Aprobadas Pendientes de Pago", "Ordenes por recibir facturas" y "Ordenes por Facturar".
- **Logística (HM):** "Confirmar Stock", "Órdenes por Recibir", "Ordenes Recibidas", "Órdenes por Despachar" y "Ordenes Despachadas".

## 6. Plan de Refactorización Técnica (Gap Analysis)

La base de datos y la lógica de backend observadas en el video ya soportan gran parte de este flujo (como la creación de la OT que divide las OCs, o la confirmación de stock previa a gerencia). El trabajo principal consistirá en reasignar permisos de visualización (RBAC) y aislar las interfaces actuales en los Widgets definidos.

### 6.1 Creación de Pedido y Análisis Técnico

- **Estado Actual:** El "Vendedor" de Heavy Market arma el requerimiento.
- **Refactorización UI/UX:** Trasladar la vista completa del carrito, catálogo de piezas y carga masiva al rol de Gestor de Maquinaria.
- **Refactorización Backend:** El botón de envío debe cambiar el estado a `PENDING_ANALYSIS` y rutearlo a la bandeja del Analista Técnico. El Analista mantiene su interfaz actual de cruce de referencias, y su botón de finalización es el único que dispara el estado `RFQ_BROADCAST`.

### 6.2 Generación de Orden de Trabajo (OT) y Órdenes de Compra (OC)

- **Estado Actual:** El asesor interno compara cotizaciones, aplica utilidad y genera las órdenes.
- **Refactorización UI/UX:** El panel comparador de cotizaciones pasa a ser exclusividad del Gestor de Maquinaria.
- **Refactorización Backend (Reciclaje):** Aprovechar la lógica actual del sistema. Cuando el Gestor aprueba los repuestos y genera la Orden de Trabajo (OT), el sistema debe continuar disparando automáticamente las Órdenes de Compra (OCs) correspondientes por proveedor. El estado del pedido avanza a `READY_FOR_REVIEW` y luego a `PO_STOCK_CHECK`.

### 6.3 Confirmación de Stock y Aprobación Financiera

- **Estado Actual:** La confirmación de stock la hacía el usuario proveedor genérico, y luego pasaba a gerencia.
- **Refactorización UI/UX:** La tarea de separar mercancía y confirmar disponibilidad de stock (`PO_STOCK_CHECK`) debe asignarse específicamente al rol de Logística (Org B).
- **Refactorización Backend:** Mantener el candado actual: el Gerente (Org A) no recibe la OC para aprobación financiera (`PO_PENDING_APPROVAL`) hasta que Logística del proveedor haya garantizado el inventario. El Gerente solo requiere una vista simplificada de aprobación/rechazo financiero.

### 6.4 Recepción, Inventario de Transición y CMMS Lite

- **Estado Actual:** Logística del cliente daba por "Recibida" la orden y finalizaba el ciclo.
- **Refactorización Backend:** Al presionar "Recibir" (`DELIVERED`), el sistema debe inyectar esos repuestos en un Inventario de Transición (`IN_STOCK`).
- **Nuevo Desarrollo (UI/UX):** Crear el formulario de Remisión de Salida para el Almacenista. Para pasar un repuesto a estado `INSTALLED`, el sistema debe validar cuatro campos obligatorios: validación de máquina, horómetro de instalación (numérico), evidencia fotográfica del tablero, y el nombre del responsable u operador.

### 6.5 Implementación de Dashboards por Widgets

El frontend debe abandonar las vistas monolíticas y renderizar `/dashboard` inyectando únicamente los componentes autorizados para cada rol:

**Organización A (Cliente):**

- Gestor: "Pedidos en Borrador", "Comparativos de cotizaciones", "Ordenes de Trabajo en curso" y "Ordenes de Trabajo finalizadas".
- Gerente: "Órdenes de Compra Pendientes de Aprobación", "Órdenes de Compra Aprobadas", "KPIs financieros" y "Estadísticas maquinaria".
- Contador: "Órdenes Aprobadas Pendientes de Pago", "Ordenes por recibir facturas" y "Ordenes Completadas".
- Almacenista: "Recepciones en Tránsito", "Ordenes Recibidas", "Inventario de Transición" y "Remisiones Generadas".

**Organización B (Proveedor):**

- Vendedor: "Nuevos Requerimientos a Cotizar", "Órdenes de Compra en Curso" y "Órdenes de Compra entregadas".
- Facturador: "Pagos a Verificar", "Pagos Verificados", "Órdenes por Facturar" y "Ordenes Facturadas".
- Logística: "Confirmar Stock", "Órdenes por Despachar" y "Ordenes Despachadas".

**Organización C (Heavy Market / Broker):**

- Analista Técnico: "Pedidos por Analizar" y "Pedidos Analizados".
- Vendedor Broker: widget exclusivo "Cotizador Omnicanal (Broker)".
- Gerente: "Órdenes de Compra Pendientes de Aprobación", "Órdenes de Compra Aprobadas" y "Negocios de plataforma".
- Contabilidad: "Órdenes Aprobadas Pendientes de Pago", "Ordenes por recibir facturas" y "Ordenes por Facturar".
- Logística: "Confirmar Stock", "Órdenes por Recibir", "Ordenes Recibidas", "Órdenes por Despachar" y "Ordenes Despachadas".

---

Entregar esta estructura al equipo de desarrollo garantiza que los componentes ya programados en React/Tailwind se reutilicen inyectándolos directamente en los contenedores de los widgets correspondientes, limitando el trabajo nuevo a las validaciones del CMMS.
