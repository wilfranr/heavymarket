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
    // Estados nuevos del cliente
    case PendienteRevisionStock = 'Pendiente de Revisión de Stock';
    case StockIncompleto = 'Stock Incompleto';
    case EnEsperaAprobacionGerencial = 'En Espera de Aprobación Gerencial';
    case DevueltaPorGerencia = 'Devuelta por Gerencia';
    case PendienteDePago = 'Pendiente de Pago';
    case PagadaListaDespacho = 'Pagada / Lista para Despacho';
    case CanceladaReembolsoPendiente = 'Cancelada - Reembolso Pendiente';
    case EnTransito = 'En Tránsito';
    case RecepcionConNovedades = 'Recepción con Novedades (Bloqueada)';
    case EntregadaCerrada = 'Entregada / Cerrada';

    // Estados existentes / retrocompatibilidad
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
            // Ciclo nuevo formal
            self::PendienteRevisionStock => [
                self::StockIncompleto,
                self::EnEsperaAprobacionGerencial,
                self::Confirmada,
                self::Cancelada,
            ],
            self::StockIncompleto => [
                self::EnEsperaAprobacionGerencial,
                self::Cancelada,
            ],
            self::EnEsperaAprobacionGerencial => [
                self::PendienteDePago,
                self::DevueltaPorGerencia,
                self::Cancelada,
            ],
            self::DevueltaPorGerencia => [
                self::EnEsperaAprobacionGerencial,
                self::PendienteRevisionStock,
                self::Cancelada,
            ],
            self::PendienteDePago => [
                self::PagadaListaDespacho,
                self::Pagada,
                self::Cancelada,
            ],
            self::PagadaListaDespacho => [
                self::EnTransito,
                self::Despachada,
                self::CanceladaReembolsoPendiente,
                self::Cancelada,
            ],
            self::CanceladaReembolsoPendiente => [],
            self::EnTransito => [
                self::RecepcionConNovedades,
                self::EntregadaCerrada,
                self::RecibidaParcialmente,
                self::Recibida,
                self::Cancelada,
            ],
            self::RecepcionConNovedades => [
                self::PagadaListaDespacho,
                self::EntregadaCerrada,
                self::Cancelada,
            ],
            self::EntregadaCerrada => [],

            // Ciclo existente (retrocompatibilidad operativa)
            self::Generada => [
                self::PendienteRevisionStock,
                self::Enviada,
                self::Cancelada,
            ],
            self::Enviada => [
                self::Confirmada,
                self::StockIncompleto,
                self::EnEsperaAprobacionGerencial,
                self::Cancelada,
            ],
            self::Confirmada => [
                self::PendienteDePago,
                self::EnEsperaAprobacionGerencial,
                self::Pagada,
                self::Despachada,
                self::EnTransito,
                self::Cancelada,
            ],
            self::Pagada => [
                self::EnTransito,
                self::Despachada,
                self::CanceladaReembolsoPendiente,
                self::Cancelada,
            ],
            self::Despachada => [
                self::EnTransito,
                self::RecepcionConNovedades,
                self::EntregadaCerrada,
                self::RecibidaParcialmente,
                self::Recibida,
                self::Cancelada,
            ],
            self::RecibidaParcialmente => [
                self::Recibida,
                self::EntregadaCerrada,
                self::RecepcionConNovedades,
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
        return in_array($this, [self::Recibida, self::EntregadaCerrada, self::Cancelada, self::CanceladaReembolsoPendiente], true);
    }

    public function requiereMotivoCancelacion(): bool
    {
        return in_array($this, [self::Cancelada, self::CanceladaReembolsoPendiente], true);
    }

    public function requiereAprobacionAdminParaCancelar(): bool
    {
        return in_array($this, [
            self::Confirmada,
            self::Pagada,
            self::PagadaListaDespacho,
            self::EnEsperaAprobacionGerencial,
        ], true);
    }

    public function color(): string
    {
        return match ($this) {
            self::Generada,
            self::PendienteRevisionStock => '#FFFF00',
            self::StockIncompleto => '#FF9800',
            self::EnEsperaAprobacionGerencial => '#2196F3',
            self::DevueltaPorGerencia => '#F44336',
            self::PendienteDePago => '#FFC107',
            self::Pagada,
            self::PagadaListaDespacho => '#9C27B0',
            self::CanceladaReembolsoPendiente => '#D32F2F',
            self::Enviada,
            self::Despachada,
            self::EnTransito => '#00BCD4',
            self::Confirmada => '#8BC34A',
            self::RecepcionConNovedades => '#E91E63',
            self::RecibidaParcialmente => '#FF9800',
            self::Recibida,
            self::EntregadaCerrada => '#00ff00',
            self::Cancelada => '#ff0000',
        };
    }

    /**
     * @return array<int, OrdenCompraEstado>
     */
    public static function todos(): array
    {
        return [
            self::PendienteRevisionStock,
            self::StockIncompleto,
            self::EnEsperaAprobacionGerencial,
            self::DevueltaPorGerencia,
            self::PendienteDePago,
            self::PagadaListaDespacho,
            self::CanceladaReembolsoPendiente,
            self::EnTransito,
            self::RecepcionConNovedades,
            self::EntregadaCerrada,
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
