# Especificación Funcional - HeavyMarket

El sistema se divide en dos áreas principales de operación: la **Zona Pública (Landing Page)** para clientes y visitantes, y la **Zona Privada (Dashboard Admin)** para la gestión operativa.

## 1. Zona Pública (Landing Page)
Orientada a la captación de leads y servicio al cliente final.

*   **Catálogo de Productos**: Navegación por categorías y subcategorías de repuestos y maquinaria.
*   **Buscador Global**: Filtrado rápido de referencias y artículos por código o nombre.
*   **Formulario de Cotización**: Permite a los usuarios no registrados (o registrados) solicitar cotizaciones de referencias específicas.
*   **Registro y Login de Clientes**: Acceso para que los clientes consulten el estado de sus pedidos y flota de máquinas.
*   **Integración Social**: Login mediante proveedores externos (Google, etc.) vía Socialite.

## 2. Zona Privada (Dashboard Administrativo)
El núcleo operativo de la empresa, protegido por roles de seguridad.

### Gestión Comercial
*   **Módulo de Pedidos**: Recepción de solicitudes, asignación de máquinas y estados de análisis.
    *   **Flujo de Referencias en Pedidos (Asesor/Analista)**:
        *   El asesor puede escribir una referencia manual aunque no exista en catálogo.
        *   El sistema sugiere referencias existentes (autocompletado) priorizando el tipo de artículo seleccionado.
        *   Si no existe coincidencia, la referencia se crea como **temporal** para no bloquear el registro del pedido.
        *   El analista valida y corrige posteriormente la referencia definitiva durante el análisis.
*   **Proceso de Costeo**: Herramientas para comparar precios de diferentes proveedores para una misma referencia.
*   **Módulo de Cotizaciones**: Generación de documentos formales para clientes con cálculo de TRM y vencimientos.
*   **Órdenes de Compra/Trabajo**: Transformación de cotizaciones aprobadas en órdenes operativas.

### Gestión de Activos y Terceros
*   **Directorio de Terceros**: CRM para gestionar Clientes y Proveedores, incluyendo sus contactos, direcciones y documentos legales (RUT, Certificaciones).
*   **Gestión de Flotas (Máquinas)**: Registro detallado de maquinaria por serie, modelo y marca asociada a cada cliente.
*   **Catálogo Técnico**: Administración de Artículos, Referencias Cruzadas y Juegos (Kits) de repuestos.

### Administración y Configuración
*   **Gestión de Usuarios**: Control de acceso y perfiles (Administradores, Vendedores, Super Admin).
*   **Configuración de Landing**: Administración dinámica de categorías, imágenes del carrusel y contenido informativo.
*   **Herramientas Auxiliares**: Gestión de TRM diaria, transportadoras y sistemas de la máquina.

## 3. Flujo de Trabajo Principal (Happy Path)
1.  **Entrada**: Un cliente solicita una pieza en la Landing Page.
2.  **Conversión**: El sistema crea un `Pedido` y notifica al administrador.
3.  **Procesamiento**: El asesor/administrador captura referencias (existentes o temporales) y el analista valida la `Referencia` correcta antes de costeo.
4.  **Cierre**: Se envía la `Cotización` al cliente; si se aprueba, se genera la `Orden de Trabajo`.

## 4. Reglas por Estado (Pedidos)

- **Nuevo**:
  - Se permite guardar pedido con información parcial.
  - Se permite captura de referencias manuales (con o sin asociación inmediata a catálogo).
- **En_Analisis**:
  - El analista completa/valida referencias, tipo de artículo, cantidades y contexto técnico.
  - Puede trabajar con referencias temporales pendientes de validación.
- **En_Costeo**:
  - Debe existir referencia válida por línea para operar costeo y comparación de proveedores.
  - El paso a costeo aplica validaciones estrictas de integridad por ítem.

## 5. Comportamiento Esperado en el Campo Referencia

- Si el usuario selecciona una sugerencia del catálogo, el sistema guarda el vínculo técnico (`referencia_id`).
- Si el usuario escribe código libre sin coincidencia, el sistema crea referencia temporal al guardar.
- La interfaz debe permitir operación continua del asesor sin bloquear captura por falta de catálogo previo.
