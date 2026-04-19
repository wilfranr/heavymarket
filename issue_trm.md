## Descripción
Se requiere validar el funcionamiento técnico y la seguridad de los endpoints de la API de TRM (Tasa de Cambio). Recientemente se aplicaron restricciones de roles en el frontend que deben ser validadas contra las respuestas del backend.

## Puntos de Validación
1. **Funcionalidad CRUD**:
   - `GET /api/v1/trms`: Listado paginado de TRMs.
   - `GET /api/v1/trms/latest`: Obtención de la tasa más reciente.
   - `POST /api/v1/trms`: Creación manual de TRM (validar `StoreTRMRequest`).
   - `PUT /api/v1/trms/{id}`: Actualización de valores.

2. **Seguridad y Roles**:
   - Validar que el middleware de autenticación Sanctum funcione correctamente.
   - Verificar si el backend debe implementar restricciones adicionales para el rol de **Vendedor**, ya que actualmente la restricción es solo a nivel de Frontend.

3. **Mejoras Sugeridas**:
   - Evaluar la integración automática con el servicio de la Superfinanciera de Colombia para evitar la carga manual diaria.
   - Validar unicidad de TRM por fecha (actualmente el controlador permite múltiples registros diarios).

## Contexto Técnico
- **Controlador**: `heavy-api/app/Http/Controllers/Api/V1/TRMController.php`
- **Modelo**: `heavy-api/app/Models/TRM.php`
- **Frontend**: Se aplicaron `roleGuard` en `heavy-front/src/app.routes.ts` para restringir el acceso al rol Vendedor.
