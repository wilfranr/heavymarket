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
    case Generada = 'Generada';
    case Enviada = 'Enviada';
    case Confirmada = 'Confirmada';
    case Pagada = 'Pagada';
    case Despachada = 'Despachada';
    case RecibidaParcialmente = 'Recibida parcialmente';
    case Recibida = 'Recibida';
    case Cancelada = 'Cancelada';

    /**
     * Transiciones válidas desde el estado actual.
     *
     * @return array<int, OrdenCompraEstado>
     */
    public function transicionesValidas(): array
    {
        return match ($this) {
            self::Generada => [
                self::Enviada,
                self::Cancelada,
            ],
            self::Enviada => [
                self::Confirmada,
                self::Cancelada,
            ],
            self::Confirmada => [
                self::Pagada,
                self::Cancelada,
            ],
            self::Pagada => [
                self::Despachada,
                self::Cancelada,
            ],
            self::Despachada => [
                self::RecibidaParcialmente,
                self::Recibida,
                self::Cancelada,
            ],
            self::RecibidaParcialmente => [
                self::Recibida,
            ],
            self::Recibida,
            self::Cancelada => [],
        };
    }

    public function puedeTransitarA(self $destino): bool
    {
        return in_array($destino, $this->transicionesValidas(), true);
    }

    public function esTerminal(): bool
    {
        return in_array($this, [self::Recibida, self::Cancelada], true);
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
            self::Generada => '#FFFF00',
            self::Enviada => '#2196F3',
            self::Confirmada => '#8BC34A',
            self::Pagada => '#9C27B0',
            self::Despachada => '#E91E63',
            self::RecibidaParcialmente => '#FF9800',
            self::Recibida => '#00ff00',
            self::Cancelada => '#ff0000',
        };
    }

    /**
     * @return array<int, OrdenCompraEstado>
     */
    public static function todos(): array
    {
        return [
            self::Generada,
            self::Enviada,
            self::Confirmada,
            self::Pagada,
            self::Despachada,
            self::RecibidaParcialmente,
            self::Recibida,
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
