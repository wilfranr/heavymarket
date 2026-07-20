<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Enum de estados de Orden de Compra.
 *
 * Centraliza el ciclo de vida operativo de una OC desde su generación hasta
 * el cierre formal o cancelación.
 */
enum OrdenCompraEstado: string
{
    case PendienteDeEnvio = 'Pendiente de envío';
    case Enviada = 'Enviada';
    case Confirmada = 'Confirmada';
    case RecibidaParcialmente = 'Recibida parcialmente';
    case Recibida = 'Recibida';
    case Cerrada = 'Cerrada';
    case Cancelada = 'Cancelada';

    /**
     * Transiciones válidas desde el estado actual.
     *
     * @return array<int, OrdenCompraEstado>
     */
    public function transicionesValidas(): array
    {
        return match ($this) {
            self::PendienteDeEnvio => [
                self::Enviada,
                self::Cancelada,
            ],
            self::Enviada => [
                self::Confirmada,
                self::RecibidaParcialmente,
                self::Recibida,
                self::Cancelada,
            ],
            self::Confirmada => [
                self::RecibidaParcialmente,
                self::Recibida,
                self::Cancelada,
            ],
            self::RecibidaParcialmente => [
                self::Recibida,
                self::Cerrada,
            ],
            self::Recibida => [
                self::Cerrada,
            ],
            self::Cerrada,
            self::Cancelada => [],
        };
    }

    public function puedeTransitarA(self $destino): bool
    {
        return in_array($destino, $this->transicionesValidas(), true);
    }

    public function esTerminal(): bool
    {
        return in_array($this, [self::Cerrada, self::Cancelada], true);
    }

    public function requiereMotivoCancelacion(): bool
    {
        return $this === self::Cancelada;
    }

    public function requiereAprobacionAdminParaCancelar(): bool
    {
        return $this === self::Confirmada;
    }

    public function color(): string
    {
        return match ($this) {
            self::PendienteDeEnvio => '#FFFF00',
            self::Enviada => '#2196F3',
            self::Confirmada => '#8BC34A',
            self::RecibidaParcialmente => '#FF9800',
            self::Recibida => '#00ff00',
            self::Cerrada => '#4CAF50',
            self::Cancelada => '#ff0000',
        };
    }

    /**
     * @return array<int, OrdenCompraEstado>
     */
    public static function todos(): array
    {
        return [
            self::PendienteDeEnvio,
            self::Enviada,
            self::Confirmada,
            self::RecibidaParcialmente,
            self::Recibida,
            self::Cerrada,
            self::Cancelada,
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
}
