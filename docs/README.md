# Documentación del Sistema HeavyMarket

Este directorio reúne la documentación funcional y técnica del proyecto HeavyMarket.

## Índice

1. [**Especificación Funcional**](especificacion_funcional.md)  
   Alcance por módulos, reglas de negocio y flujo operativo (Landing -> Pedido -> Análisis -> Costeo -> Cotización).
2. [**Diccionario de Datos**](diccionario_datos.md)  
   Entidades principales, relaciones y convenciones de modelado.
3. [**Arquitectura del Sistema**](arquitectura.md)  
   Vista de backend/frontend, integración API y decisiones de diseño.

## Convenciones de Terminología

- **Tipo de artículo**: catálogo en `listas` con `tipo = "Tipo de Artículo"` (campo `lista_id` en líneas de pedido).
- **Referencia**: código de parte del catálogo `referencias` (campo técnico `referencia_id`).
- **Referencia temporal**: referencia creada con `es_temporal = true` para no bloquear captura comercial.
- **Definición**: texto de apoyo/captura manual en línea de pedido (`pedido_referencia.definicion`) cuando aún no hay asociación definitiva.

## Mantenimiento

Actualizar esta documentación cuando cambien:

- reglas funcionales de creación/edición/análisis de pedidos,
- contratos API (payloads de referencias, estados o validaciones),
- estructura de datos relevante (`pedidos`, `pedido_referencia`, `referencias`, `articulos`, `listas`).
