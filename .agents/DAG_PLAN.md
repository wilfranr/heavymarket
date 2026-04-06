graph TD
    subgraph "Fase 1: Estabilización - FINALIZADA"
        T1[T1: Refactor PedidoService Laravel] --> |OK| T2[T2: Tipado Estricto Angular]
        T2 --> |OK| T3[T3: Fixes TRM y Pesos]
    end

    subgraph "Fase 2: Escalabilidad - FINALIZADA"
        T4[T4: Job Asíncrono SyncPedidoImages] --> |OK| T5[T5: Desacoplamiento Controller]
    end

    subgraph "Fase 3: Validación - PENDIENTE"
        T3 --> T6[T6: Configuración Playwright]
        T5 --> T6
        T6 --> T7[T7: Ejecución E2E Final y Cierre]
    end