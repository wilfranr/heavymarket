# Documentación API - HeavyMarket v1

**Base URL:** `http://localhost:8000/api/v1`

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

```http
POST /api/v1/register
```

**Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "device_name": "iPhone 13"
}
```

**Respuesta (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "roles": ["panel_user"]
    },
    "access_token": "1|abcdef123456...",
    "token_type": "Bearer",
    "expires_in": 2592000
  }
}
```

---

### Iniciar Sesión

```http
POST /api/v1/login
```

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "Password123!",
  "device_name": "Chrome Browser"
}
```

**Respuesta (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "roles": ["Vendedor"],
      "permissions": []
    },
    "access_token": "2|xyz789...",
    "token_type": "Bearer",
    "expires_in": 2592000
  }
}
```

---

### Cerrar Sesión

```http
POST /api/v1/logout
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### Información del Usuario

```http
GET /api/v1/me
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "data": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "email_verified_at": null,
    "created_at": "2026-01-18T12:00:00.000000Z",
    "roles": ["Vendedor"],
    "permissions": []
  }
}
```

---

### Refrescar Token

```http
POST /api/v1/refresh
Authorization: Bearer {token}
```

**Respuesta (200):**
```json
{
  "message": "Token refrescado exitosamente",
  "data": {
    "access_token": "3|newtoken...",
    "token_type": "Bearer",
    "expires_in": 2592000
  }
}
```

---

## Pedidos

### Listar Pedidos

```http
GET /api/v1/pedidos?estado=Nuevo&per_page=15&page=1
Authorization: Bearer {token}
```

**Query Parameters:**
- `estado` (opcional): Filtrar por estado
- `tercero_id` (opcional): Filtrar por tercero
- `fabricante_id` (opcional): Filtrar por fabricante
- `search` (opcional): Buscar en comentarios/dirección
- `per_page` (opcional, default: 15): Elementos por página
- `page` (opcional, default: 1): Número de página
- `sort_by` (opcional, default: created_at): Campo de ordenamiento
- `sort_order` (opcional, default: desc): Orden (asc/desc)

**Respuesta (200):**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "tercero_id": 5,
      "direccion": "Calle 123 #45-67",
      "comentario": "Urgente",
      "estado": "Nuevo",
      "created_at": "2026-01-18T12:00:00.000000Z",
      "user": {
        "id": 1,
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "tercero": {
        "id": 5,
        "razon_social": "Empresa ABC"
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73
  }
}
```

---

### Crear Pedido

```http
POST /api/v1/pedidos
Authorization: Bearer {token}
```

**Body:**
```json
{
  "tercero_id": 5,
  "direccion": "Calle 123 #45-67",
  "comentario": "Pedido urgente",
  "contacto_id": 3,
  "estado": "Nuevo",
  "maquina_id": 2,
  "fabricante_id": 10,
  "referencias": [
    {
      "referencia_id": 15,
      "cantidad": 10,
      "precio_unitario": 50000
    }
  ],
  "articulos": [
    {
      "articulo_id": 8,
      "cantidad": 5,
      "precio_unitario": 25000
    }
  ]
}
```

**Respuesta (201):**
```json
{
  "data": {
    "id": 1,
    "user_id": 1,
    "tercero_id": 5,
    "estado": "Nuevo",
    "created_at": "2026-01-18T12:00:00.000000Z"
  },
  "message": "Pedido creado exitosamente"
}
```

---

### Ver Pedido

```http
GET /api/v1/pedidos/{id}
Authorization: Bearer {token}
```

---

### Actualizar Pedido

```http
PUT /api/v1/pedidos/{id}
Authorization: Bearer {token}
```

**Body:**
```json
{
  "estado": "Enviado",
  "comentario": "Actualizado"
}
```

---

### Eliminar Pedido

```http
DELETE /api/v1/pedidos/{id}
Authorization: Bearer {token}
```

**Respuesta (204):** Sin contenido

---

## Terceros

### Listar Terceros

```http
GET /api/v1/terceros?tipo_tercero=Juridico&es_cliente=true
Authorization: Bearer {token}
```

**Query Parameters:**
- `tipo_tercero` (opcional): Natural o Juridico
- `es_cliente` (opcional): true/false
- `es_proveedor` (opcional): true/false
- `search` (opcional): Buscar por nombre/documento

---

### Crear Tercero

```http
POST /api/v1/terceros
Authorization: Bearer {token}
```

**Body:**
```json
{
  "tipo_documento": "NIT",
  "documento": "900123456-7",
  "razon_social": "Empresa XYZ S.A.S.",
  "nombre_comercial": "XYZ",
  "tipo_tercero": "Juridico",
  "email": "contacto@xyz.com",
  "telefono": "601 234 5678",
  "celular": "310 123 4567",
  "direccion": "Cra 7 #10-20",
  "ciudad": "Bogotá",
  "pais": "Colombia",
  "es_cliente": true,
  "es_proveedor": false,
  "estado": "Activo"
}
```

---

## Cotizaciones

### Listar Cotizaciones

```http
GET /api/v1/cotizaciones?estado=En_Proceso
Authorization: Bearer {token}
```

---

### Crear Cotización

```http
POST /api/v1/cotizaciones
Authorization: Bearer {token}
```

**Body:**
```json
{
  "pedido_id": 1,
  "tercero_id": 5
}
```

---

## Órdenes de Compra

### Listar Órdenes de Compra

```http
GET /api/v1/ordenes-compra?proveedor_id=10
Authorization: Bearer {token}
```

---

### Crear Orden de Compra

```http
POST /api/v1/ordenes-compra
Authorization: Bearer {token}
```

**Body:**
```json
{
  "proveedor_id": 10,
  "estado": "Pendiente",
  "observaciones": "Entrega en 15 días"
}
```

---

## Catálogos

### Fabricantes

```http
GET /api/v1/fabricantes
POST /api/v1/fabricantes
GET /api/v1/fabricantes/{id}
PUT /api/v1/fabricantes/{id}
DELETE /api/v1/fabricantes/{id}
Authorization: Bearer {token}
```

### Sistemas

```http
GET /api/v1/sistemas
POST /api/v1/sistemas
GET /api/v1/sistemas/{id}
PUT /api/v1/sistemas/{id}
DELETE /api/v1/sistemas/{id}
Authorization: Bearer {token}
```

### Máquinas

```http
GET /api/v1/maquinas
POST /api/v1/maquinas
GET /api/v1/maquinas/{id}
PUT /api/v1/maquinas/{id}
DELETE /api/v1/maquinas/{id}
Authorization: Bearer {token}
```

---

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Eliminación exitosa
- **401 Unauthorized**: No autenticado
- **403 Forbidden**: Sin permisos
- **404 Not Found**: Recurso no encontrado
- **422 Unprocessable Entity**: Error de validación
- **500 Server Error**: Error interno del servidor

---

## Roles del Sistema

1. **super_admin**: Acceso completo
2. **Administrador**: Gestión general
3. **Vendedor**: Pedidos y cotizaciones
4. **Analista**: Reportes
5. **Logistica**: Órdenes de compra/trabajo
6. **panel_user**: Usuario básico

---

## Notas Importantes

- Todos los endpoints requieren autenticación excepto `/register` y `/login`
- Los tokens expiran en 30 días
- Las fechas están en formato ISO 8601 (UTC)
- La paginación por defecto es de 15 elementos
- Los filtros se pasan como query parameters
- Los mensajes de error incluyen detalles de validación

---

**Versión API:** v1  
**Última actualización:** 18 de Enero, 2026  
**Stack**: Laravel 12 + Sanctum + MySQL
