<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Estados de la Orden de Trabajo (OT).
 *
 * `Completado` se mantiene por compatibilidad con datos existentes, pero el
 * motor de progreso automatico (OrdenTrabajoLifecycleService) nunca lo asigna:
 * el destino automatico del cierre tecnico es `ListaParaFacturar`, y el cierre
 * comercial final tras la facturacion es `Cerrada`
 * (ver OrdenTrabajoFacturacionService).
 */
enum OrdenTrabajoEstado: string
{
    case Pendiente = 'Pendiente';
    case EnProceso = 'En Proceso';
    case ListaParaFacturar = 'Lista para Facturar';
    case Completado = 'Completado';
    case Cerrada = 'Cerrada';
    case Cancelado = 'Cancelado';

    public function esTerminal(): bool
    {
        return in_array($this, [self::Completado, self::Cerrada, self::Cancelado], true);
    }

    /**
     * @return array<int, self>
     */
    public static function todos(): array
    {
        return [
            self::Pendiente,
            self::EnProceso,
            self::ListaParaFacturar,
            self::Completado,
            self::Cerrada,
            self::Cancelado,
        ];
    }

    /**
     * @return array<int, string>
     */
    public static function toArray(): array
    {
        return array_map(
            static fn (self $estado): string => $estado->value,
            self::todos()
        );
    }

    /**
     * Valores que un usuario puede asignar manualmente desde el endpoint
     * generico de actualizacion. `ListaParaFacturar` y `Cerrada` quedan
     * excluidos porque solo los motores automaticos (OrdenTrabajoLifecycleService
     * y OrdenTrabajoFacturacionService, respectivamente) pueden alcanzarlos.
     *
     * @return array<int, string>
     */
    public static function asignablesManualmente(): array
    {
        $excluidos = [self::ListaParaFacturar, self::Cerrada];

        return array_map(
            static fn (self $estado): string => $estado->value,
            array_filter(self::todos(), static fn (self $estado): bool => ! in_array($estado, $excluidos, true))
        );
    }
}
