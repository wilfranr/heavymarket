# Checklist de Pruebas - HeavyMarket Frontend

**Fecha**: 19 de Enero, 2026  
**Estado**: En proceso de testing

---

## 🎯 Fase 1: Verificación Básica

### ✅ 1. Compilación y Arranque
- [x] El proyecto compila sin errores (`npm start`)
- [x] La aplicación se carga en `http://localhost:4200`
- [x] No hay errores en la consola del navegador
- [x] El diseño se muestra correctamente (layout Sakai)
- [x] Spinner de carga en color amarillo

### ✅ 2. Layout y Navegación Base
- [x] Redirige correctamente a `/auth/login` cuando no está autenticado
- [x] URL limpia sin bucles infinitos de redirección
- [x] El color primario es amarillo en toda la aplicación
- [x] El toggle de tema claro/oscuro funciona
- [x] La preferencia de tema persiste en localStorage
- [x] Solo aparece el botón de sol/luna (panel de colores oculto)

---

## 🔐 Fase 2: Autenticación

### ✅ 3. Login
- [x] Se puede acceder a `/auth/login`
- [x] El formulario se muestra correctamente
- [x] Validaciones funcionan (campos requeridos)
- [x] Login con credenciales válidas funciona
- [x] Login con credenciales inválidas muestra error (toast rojo)
- [x] Redirección al dashboard después de login exitoso
- [x] Token se guarda en localStorage

### ✅ 4. Register
- [ ] Se puede acceder a `/auth/register`
- [ ] El formulario se muestra correctamente
- [ ] Validaciones funcionan (email, password, confirmación)
- [ ] Registro exitoso funciona
- [ ] Registro con email duplicado muestra error
- [ ] Redirección al dashboard después de registro

### ✅ 5. Logout
- [x] El botón de logout se muestra en el topbar (dropdown de perfil)
- [x] Dropdown del perfil se despliega correctamente
- [x] Logout funciona correctamente
- [x] Token se elimina de localStorage
- [x] Redirección a login después de logout

---

## 📊 Fase 3: Dashboard

### ✅ 6. Dashboard Principal
- [x] Se puede acceder a `/` (dashboard)
- [x] Los widgets de estadísticas se muestran
- [x] Los números de estadísticas son correctos
- [x] El widget de "Pedidos Recientes" se muestra
- [x] El widget de "Notificaciones" se muestra
- [x] Los gráficos/charts se renderizan correctamente
- [x] El dashboard es responsive

---

## 📦 Fase 4: Módulo de Pedidos

### ✅ 7. Lista de Pedidos
- [ ] Se puede acceder a `/pedidos`
- [ ] La tabla de pedidos se muestra correctamente
- [ ] Los pedidos cargan desde la API
- [ ] La paginación funciona
- [ ] El filtro por estado funciona (dropdown)
- [ ] La búsqueda global funciona
- [ ] Los botones de acciones se muestran (Ver, Editar, Eliminar)
- [ ] El botón "Nuevo Pedido" funciona

### ✅ 8. Crear Pedido
- [ ] Se puede acceder a `/pedidos/create`
- [ ] El formulario se muestra correctamente
- [ ] Los dropdowns cargan datos (Clientes, Estados, Máquinas)
- [ ] El dropdown de clientes tiene filtro funcional
- [ ] Validaciones funcionan (campos requeridos)
- [ ] Crear pedido exitoso funciona
- [ ] Muestra mensaje de éxito (toast)
- [ ] Redirección a lista después de crear

### ✅ 9. Ver Detalle de Pedido
- [ ] Se puede acceder a `/pedidos/:id`
- [ ] Los datos del pedido se muestran correctamente
- [ ] La información del cliente se muestra
- [ ] La información de la máquina se muestra (si existe)
- [ ] El estado se muestra con el tag correcto
- [ ] Los tabs funcionan (Referencias, Artículos)
- [ ] Tab de Referencias muestra datos correctos
- [ ] Tab de Artículos muestra datos correctos
- [ ] Mensaje "No hay datos" si tabs vacíos

### ✅ 10. Editar Pedido
- [ ] Se puede acceder a `/pedidos/:id/edit`
- [ ] El formulario se carga con datos existentes
- [ ] Los dropdowns muestran valores seleccionados
- [ ] Editar pedido funciona correctamente
- [ ] Muestra mensaje de éxito
- [ ] Los cambios se reflejan en la lista

### ✅ 11. Eliminar Pedido
- [ ] El botón de eliminar funciona
- [ ] Se muestra diálogo de confirmación
- [ ] Cancelar el diálogo no elimina
- [ ] Confirmar elimina el pedido
- [ ] Muestra mensaje de éxito
- [ ] El pedido desaparece de la lista

---

## 👥 Fase 5: Módulo de Terceros

### ✅ 12. Lista de Terceros
- [ ] Se puede acceder a `/terceros`
- [ ] La tabla de terceros se muestra correctamente
- [ ] Los terceros cargan desde la API
- [ ] La paginación funciona
- [ ] El filtro global funciona (búsqueda)
- [ ] Los filtros por tipo funcionan (Cliente/Proveedor)
- [ ] Los botones de acciones funcionan
- [ ] Los tags de tipo se muestran correctamente

### ✅ 13. Ver Detalle de Tercero
- [ ] Se puede acceder a `/terceros/:id`
- [ ] Los datos del tercero se muestran
- [ ] La información de contacto se muestra
- [ ] Los pedidos asociados se muestran (si existen)

### ✅ 14. Crear Tercero
- [ ] Se puede acceder a `/terceros/create`
- [ ] El formulario se muestra (cuando esté implementado)

### ✅ 15. Editar Tercero
- [ ] Se puede acceder a `/terceros/:id/edit`
- [ ] El formulario funciona (cuando esté implementado)

---

## 📋 Fase 6: Módulo de Cotizaciones

### ✅ 16. Cotizaciones (Básico)
- [ ] Se puede acceder a `/cotizaciones`
- [ ] El placeholder/lista básica se muestra
- [ ] El mensaje indica que está en desarrollo

---

## 🚚 Fase 7: Módulo de Órdenes de Compra

### ✅ 17. Órdenes de Compra (Básico)
- [ ] Se puede acceder a `/ordenes-compra`
- [ ] El placeholder/lista básica se muestra
- [ ] El mensaje indica que está en desarrollo

---

## 🔔 Fase 8: Notificaciones

### ✅ 18. Sistema de Notificaciones
- [ ] El icono de notificaciones se muestra en topbar
- [ ] El badge de contador se muestra correctamente
- [ ] Hacer clic abre el popover de notificaciones
- [ ] Las notificaciones se muestran correctamente
- [ ] Los iconos según tipo se muestran (colores)
- [ ] El tiempo relativo ("hace X minutos") se muestra
- [ ] Hacer clic en notificación la marca como leída
- [ ] El contador de no leídas actualiza
- [ ] "Marcar todas como leídas" funciona
- [ ] Las notificaciones con link navegan correctamente

---

## 🔍 Fase 9: Búsqueda Global

### ✅ 19. Búsqueda en Topbar
- [ ] El input de búsqueda se muestra en topbar
- [ ] Escribir en el input funciona
- [ ] Presionar Enter busca
- [ ] Navega a página de resultados (si está implementada)

---

## 📱 Fase 10: Responsive y UX

### ✅ 20. Responsive Design
- [ ] La aplicación funciona en desktop (1920x1080)
- [ ] La aplicación funciona en tablet (768px)
- [ ] La aplicación funciona en móvil (375px)
- [ ] El menú lateral colapsa en móvil
- [ ] Las tablas son scrollables en móvil
- [ ] Los formularios se adaptan correctamente

### ✅ 21. User Experience
- [ ] Los botones tienen hover states
- [ ] Los formularios muestran feedback visual
- [ ] Los mensajes de error son claros
- [ ] Los mensajes de éxito son claros
- [ ] Los loading states se muestran
- [ ] No hay flickering o saltos visuales

---

## 🔗 Fase 11: Integración con API

### ✅ 22. Conexión con Backend
- [ ] El backend está corriendo en `http://localhost:8000`
- [ ] Las llamadas a la API funcionan
- [ ] Los errores de API se manejan correctamente
- [ ] Los 401 redirigen a login
- [ ] Los tokens se envían correctamente
- [ ] Los interceptors funcionan

### ✅ 23. NgRx State
- [ ] Las acciones de NgRx se disparan correctamente
- [ ] Los reducers actualizan el estado
- [ ] Los selectores retornan datos correctos
- [ ] Los effects hacen llamadas a la API
- [ ] El Redux DevTools funciona (si está instalado)

---

## 🧪 Fase 12: Tests Unitarios

### ✅ 24. Ejecutar Tests
- [ ] Los tests de AuthService pasan
- [ ] Los tests de NotificationService pasan
- [ ] No hay errores en la ejecución de tests
- [ ] La cobertura es adecuada

---

## 🎨 Fase 13: Componentes de Sakai

### ✅ 25. Componentes PrimeNG
- [ ] Los `<p-select>` funcionan correctamente
- [ ] Los `<p-tabs>` funcionan correctamente
- [ ] Los `<p-popover>` funcionan correctamente
- [ ] Los `<p-table>` muestran datos
- [ ] Los `<p-button>` tienen estilos correctos
- [ ] Los `<p-tag>` muestran colores correctos

---

## 📈 Resumen de Estado

**Total de pruebas**: 120+ verificaciones  
**Completadas**: 30  
**Pendientes**: 90+  
**Bloqueadas**: 0

---

## 📝 Notas Importantes

### Módulos Implementados:
- ✅ **Pedidos**: Lista, Crear, Editar, Detalle (completamente funcional)
- ✅ **Terceros**: Lista, Crear, Editar, Detalle (completamente funcional)
- ⏳ **Cotizaciones**: Solo placeholder (pendiente implementación)
- ⏳ **Órdenes de Compra**: Solo placeholder (pendiente implementación)

### Módulos Pendientes de Prueba:
- **Fase 4**: Módulo de Pedidos (Checks 7-11) - Listo para probar
- **Fase 5**: Módulo de Terceros (Checks 12-15) - Listo para probar
- **Fase 6**: Cotizaciones (Check 16) - Solo placeholder
- **Fase 7**: Órdenes de Compra (Check 17) - Solo placeholder
- **Fase 8**: Notificaciones (Check 18) - Implementado, pendiente probar
- **Fase 9**: Búsqueda Global (Check 19) - Pendiente probar

---

## 🚀 Siguiente Paso

Continuar con **Fase 4: Módulo de Pedidos** (Checks 7-11)

---

**Última actualización**: 19/01/2026 02:30
