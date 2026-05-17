<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Origen de creación del pedido.
 */
enum PedidoOrigen: string
{
    case Panel = 'panel';
    case Landing = 'landing';
}
