# Epic: Flujo Integral de Orden de Compra (OC) con Contingencias

**Origen:** Flujo definitivo de Orden de Compra con contingencias y actores entregado por el cliente. Este documento desglosa la brecha existente entre el sistema actual (`heavy-api` y `heavy-front`) y el flujo solicitado, estructurado en issues modulares e independientes para su implementación guiada bajo Harness Engineering.

---

## Gap Analysis (Resumen de Situación Actual vs Solicitado)

| Fase / Paso del Cliente | Estado Actual en el Código | Brecha Detectada |
|---|---|---|
| **1. Generación y Envío a Revisión** | `Generada` -> `Enviada` directa al dar clic en botón. | No existe captura de modal obligatorio para "Instrucciones de despacho" previo al envío ni estado `Pendiente de Revisión de Stock`. |
| **2. Confirmación de Inventario (Faltantes)** | Proveedor solo puede dar clic a "Confirmar" (todo o nada). | Proveedor no puede editar cantidades reales disponibles. Asesor no recibe alerta de "Stock Incompleto" ni puede aprobar o cancelar. Falta estado `En Espera de Aprobación Gerencial`. |
| **3. Aprobación o Rechazo de Gerencia** | No existe intervención gerencial en el ciclo de la OC. | Falta rol y permisos de Gerente Comercial, modal obligatorio de comentarios de rechazo y estados `En Espera de Aprobación Gerencial`, `Devuelta por Gerencia` y `Pendiente de Pago`. |
| **4. Registro de Pago y Contingencia Post-Pago** | Cualquier usuario con permiso de update pasa la orden a `Pagada`. | Falta restricción de rol a `Contabilidad`, comprobante obligatorio de pago (archivo) y botón/estado de emergencia `Cancelar Orden Pagada` (`Cancelada - Reembolso Pendiente`). |
| **5. Despacho y Alertas de Tránsito** | Formulario simple de despacho en portal (`guia`, transportadora). | Falta adjunto fotográfico obligatorio al despachar y Cron Job de alerta para órdenes en tránsito prolongado (> X días). Estado pasa a `Despachada` en vez de `En Tránsito`. |
| **6. Recepción y Reporte de Novedades** | Modal de recepción registra cantidades y observaciones generales. Foto opcional. | No bloquea la OC en estado crítico `Recepción con Novedades (Bloqueada)` ante daños/faltantes. No exige foto obligatoria en novedades. |
| **7. Resolución de Conflictos Post-Novedad** | No existe flujo ni interfaz de resolución. | Asesor no cuenta con acciones para "Aprobar Reposición" (reabrir despacho parcial) o "Solicitar Nota Crédito / Reembolso" (notificar a contabilidad y cerrar con lo recibido). |

---

## Mapeo de Estados: Actual vs Nuevo Ciclo

```
Actual:
Generada -> Enviada -> Confirmada -> Pagada -> Despachada -> Recibida parcialmente / Recibida -> Cancelada

Nuevo Flujo Completo:
[Aprobación Cotización]
       |
       v
Pendiente de Revisión de Stock (Generada y enviada a proveedor con instrucciones)
       |
       +---> [Proveedor con faltantes] ---> Stock Incompleto (Asesor negocia / aprueba o cancela)
       |
       v
En Espera de Aprobación Gerencial
       |
       +---> [Gerente Rechaza con motivo] ---> Devuelta por Gerencia (Asesor corrige)
       |
       v
Pendiente de Pago (Gerente aprueba)
       |
       v
Pagada / Lista para Despacho (Contabilidad adjunta comprobante)
       |
       +---> [Siniestro / Cancelación de emergencia] ---> Cancelada - Reembolso Pendiente
       |
       v
En Tránsito (Proveedor adjunta guía y fotos) ---> [Cron Job: Alerta si > X días]
       |
       +---> [Logística: Ruta Feliz] ---> Entregada / Cerrada (Actualiza OT)
       |
       v
Recepción con Novedades (Bloqueada) [Logística reporta daño/faltante con fotos]
       |
       +---> [Asesor: Aprobar Reposición] ---------> Pagada / Lista para Despacho (saldo pendiente)
       +---> [Asesor: Solicitar Nota Crédito] -----> Notifica Contabilidad + Cierra parcial
```

---

## Estructura y Orden de Implementación (Issues)

```
01-feat-oc-maquina-estados-y-permisos
         |
         +--> 02-feat-oc-envio-revision-y-ajuste-stock (Paso 1 y 2)
         |
         +--> 03-feat-oc-aprobacion-gerencial (Paso 3) [Depende de 01 y 02]
         |
         +--> 04-feat-oc-registro-pago-y-contingencia (Paso 4) [Depende de 01 y 03]
         |
         +--> 05-feat-oc-despacho-fotos-y-alerta-transito (Paso 5) [Depende de 01 y 04]
         |
         +--> 06-feat-oc-bloqueo-novedades-y-resolucion (Paso 6 y 7) [Depende de 01 y 05]
```

| # | Archivo | Depende de | Resumen |
|---|---|---|---|
| **01** | [01-feat-oc-maquina-estados-y-permisos.md](01-feat-oc-maquina-estados-y-permisos.md) | Ninguna | Redefinición de `OrdenCompraEstado`, matriz de transiciones en `OrdenCompraLifecycleService`, migraciones de base de datos y actualización de `OrdenCompraPolicy` para los roles requeridos. |
| **02** | [02-feat-oc-envio-revision-y-ajuste-stock.md](02-feat-oc-envio-revision-y-ajuste-stock.md) | 01 | Modal de instrucciones de despacho para el Asesor al enviar, interfaz en Portal de Proveedores para ajustar cantidades disponibles por faltantes y flujo de negociación del Asesor. |
| **03** | [03-feat-oc-aprobacion-gerencial.md](03-feat-oc-aprobacion-gerencial.md) | 01, 02 | Bandeja y acciones para Gerente Comercial: Aprobación hacia `Pendiente de Pago` o Devolución a Asesor (`Devuelta por Gerencia`) con modal de justificación obligatoria. |
| **04** | [04-feat-oc-registro-pago-y-contingencia.md](04-feat-oc-registro-pago-y-contingencia.md) | 01, 03 | Formulario de pago para rol Contabilidad con comprobante obligatorio, y contingencia post-pago: botón de emergencia "Cancelar Orden Pagada" (`Cancelada - Reembolso Pendiente`). |
| **05** | [05-feat-oc-despacho-fotos-y-alerta-transito.md](05-feat-oc-despacho-fotos-y-alerta-transito.md) | 01, 04 | Despacho en Portal de Proveedores con adjuntos obligatorios de guía/fotos, estado `En Tránsito` y Cron Job para detección de alertas de tránsito prolongado (> X días). |
| **06** | [06-feat-oc-bloqueo-novedades-y-resolucion.md](06-feat-oc-bloqueo-novedades-y-resolucion.md) | 01, 05 | Bloqueo por novedades de recepción con evidencia fotográfica obligatoria (`Recepción con Novedades (Bloqueada)`), y panel de resolución para Asesor (Reposición vs Nota Crédito). |

---

## Convenciones y Guía para Triage / Harness Engineering

* **`project` en Engram:** Siempre usar `heavymarket`.
* **`topic_key` sugerido:**
  * Estados y políticas: `decision/orden-compra-lifecycle`
  * Backend Services & Controllers: `arch/heavy-api-logic`
  * Frontend Models & Components: `arch/heavy-data-mapping` y `arch/heavy-ui-patterns`
  * Auditoría y revisiones: `arch/heavy-audit-history`
* **Skills Requeridas por Nodo:**
  * Migraciones / Consultas SQL: `sql_query_analyst`
  * Arquitectura / Estados: `software_architect`
  * UI Tailwind / PrimeNG: `ui_ux_design_expert`
  * Tests: `automated_tester`
