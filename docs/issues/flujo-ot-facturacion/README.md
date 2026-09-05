# Epic: Flujo Cotización → OT → Facturación (según proceso compartido por el cliente)

**Origen:** El cliente compartió su flujo de trabajo ideal para la Orden de Trabajo (OT), describiéndola como el módulo que conecta la Cotización, las Órdenes de Compra (OC) y la Facturación final. Se comparó ese flujo contra el código actual (`heavy-api` / `heavy-front`) y se detectaron brechas de fondo, no solo de nomenclatura.

**Gap analysis (resumen):**

| Paso del cliente | Estado en el código actual |
|---|---|
| 1. Generación automática de la OT desde cotización aprobada | ✅ Ya existe (`CotizacionService::crearOrdenTrabajo()`) |
| 2. Abastecimiento progresivo (OC → OT, barra de progreso, semáforo) | ❌ No existe. La recepción de OC solo actualiza la propia OC; `orden_trabajo_referencias.cantidad_recibida` es un campo que nunca se escribe |
| 3. Depuración de faltantes | ❌ No existe ningún concepto de esto en backend ni frontend |
| 4. Cierre técnico automático (`recibida + depurada == cotizada`) | ❌ No existe. El estado de la OT se cambia manualmente vía `PUT /ordenes-trabajo/{id}` |
| 5. Facturación y cierre comercial | ❌ No existe módulo de Facturación, ni rol Contabilidad, ni estados finales de OT para esto |

Esto no es un ajuste puntual: son tres piezas nuevas (motor de sincronización, depuración de faltantes, módulo de facturación) que dependen unas de otras. Por eso se dividió en 4 issues atómicos en vez de uno solo — permite implementarlos y revisarlos por separado, y da un punto de corte claro si el cliente quiere priorizar solo hasta el cierre técnico sin llegar a facturación todavía.

## Orden de implementación (dependencias)

```
01-feat-ot-sincronizacion-progreso
        |
        +--> 02-feat-ot-depuracion-faltantes
        |
        +--> 03-feat-ot-cierre-tecnico-automatico (depende de 01 y 02)
                    |
                    +--> 04-feat-modulo-facturacion (depende de 03)
```

| # | Issue | Depende de | Resumen |
|---|-------|-----------|---------|
| 01 | [feat-ot-sincronizacion-progreso.md](01-feat-ot-sincronizacion-progreso.md) | Ninguna | Propaga la recepción de OC hacia `orden_trabajo_referencias`, agrega barra de progreso y semáforo real en la OT |
| 02 | [feat-ot-depuracion-faltantes.md](02-feat-ot-depuracion-faltantes.md) | Ninguna (puede ir en paralelo con 01) | Permite al Asesor marcar ítems como faltante definitivo, excluyéndolos de la meta de la OT |
| 03 | [feat-ot-cierre-tecnico-automatico.md](03-feat-ot-cierre-tecnico-automatico.md) | 01, 02 | El sistema detecta `recibida + depurada == cotizada` y pasa la OT a `Lista para Facturar` automáticamente |
| 04 | [feat-modulo-facturacion.md](04-feat-modulo-facturacion.md) | 03 | Módulo de Facturación nuevo: rol Contabilidad, bandeja, registro de número de factura, cierre comercial de la OT |

## Notas para Triage

Cada issue trae su propia sección de "Requerimientos Técnicos" y "Archivos afectados", pensada para poder registrarse como nodos independientes en `.harness/dag.json` (uno o varios nodos por issue, según atomicidad). El `topic_key` sugerido para Engram en las cuatro es `decision/orden-trabajo-facturacion`, con `arch/heavy-api-logic` y `arch/heavy-data-mapping` como secundarios en los nodos de implementación.

Si se decide implementar solo un subconjunto (por ejemplo, parar en el issue 03 sin llegar a facturación), la OT queda en un estado `Lista para Facturar` estable y visible, sin romper nada — el issue 04 es aditivo puro.
