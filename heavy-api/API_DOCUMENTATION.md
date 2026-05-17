# Documentación API - HeavyMarket v1

**Base URL:** `http://localhost:8000/api/v1`
**Documentación Interactiva:** `http://localhost:8000/docs/api` (Generada automáticamente por Scramble)

**Autenticación:** Bearer Token (Laravel Sanctum)

---

## Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Pedidos](#pedidos)
3. [Terceros](#terceros)
4. [Cotizaciones](#cotizaciones)
5. [Órdenes de Compra](#órdenes-de-compra)
6. [Órdenes de Trabajo](#órdenes-de-trabajo)
7. [Artículos](#artículos)
8. [Referencias](#referencias)
9. [Catálogos](#catálogos)
10. [Usuarios](#usuarios)

---

## Autenticación

### Registrar Usuario
`POST /api/v1/register`

### Iniciar Sesión
`POST /api/v1/login`

### Cerrar Sesión
`POST /api/v1/logout`

### Información del Usuario
`GET /api/v1/me`

---

## Pedidos

### Listar Pedidos
`GET /api/v1/pedidos`

### Crear Pedido
`POST /api/v1/pedidos`

### Ver Pedido
`GET /api/v1/pedidos/{id}`

### Actualizar Pedido
`PUT /api/v1/pedidos/{id}`

### Devolver a Analista
`POST /api/v1/pedidos/{id}/devolver-a-analista`

---

## Órdenes de Trabajo

### Estados Soportados
- `Pendiente`: Creada, esperando recepción.
- `En Proceso`: Al menos un ítem gestionado.
- `Completado`: Todos los ítems recibidos.
- `Cancelado`: Orden anulada.

---

## Catálogos

### Sistemas (N:N con Tipos de Artículo)

#### Listar Sistemas
`GET /api/v1/sistemas`

#### Sincronizar Tipos de Artículo
`PUT /api/v1/sistemas/{sistema}/tipos-articulo`
**Body:**
```json
{
  "lista_ids": [1, 2, 3]
}
```

---

## Notas Importantes

- El sistema utiliza **Scramble** para mantener la documentación de los endpoints sincronizada con el código en tiempo real.
- Todos los endpoints protegidos requieren el header `Authorization: Bearer {token}`.
- Las respuestas siguen el estándar de **Laravel API Resources**.

---

**Versión API:** v1  
**Última actualización:** 17 de Mayo, 2026  
**Stack**: Laravel 13 + Sanctum + Scramble + MySQL 8
