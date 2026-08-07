<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Estado de recepción computado (informativo) para una Orden de Compra o uno
 * de sus ítems, derivado de cantidad_recibida vs cantidad. No se persiste.
 */
enum EstadoRecepcion: string
{
    case EnTransito = 'En tránsito';
    case RecibidaParcial = 'Recibida parcialmente';
    case Recibida = 'Recibida';

    public static function desdeCantidades(int $cantidadRecibida, int $cantidadOrdenada): self
    {
        if ($cantidadRecibida <= 0) {
            return self::EnTransito;
        }

        if ($cantidadRecibida >= $cantidadOrdenada) {
            return self::Recibida;
        }

        return self::RecibidaParcial;
    }
}
