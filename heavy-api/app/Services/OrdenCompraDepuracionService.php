<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompraReferencia;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Gestiona la depuracion de faltantes definitivos en items de una Orden de
 * Compra cuyo transito quedo Demorado (mercancia que no llegara). No se
 * factura al cliente lo depurado.
 */
class OrdenCompraDepuracionService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function depurarFaltante(OrdenCompraReferencia $referencia, array $data, User $usuario): OrdenCompraReferencia
    {
        return DB::transaction(function () use ($referencia, $data, $usuario): OrdenCompraReferencia {
            $referencia->loadMissing('ordenCompra');

            if ($referencia->ordenCompra?->estado !== OrdenCompraEstado::Demorado->value) {
                throw ValidationException::withMessages([
                    'orden_compra' => 'Solo se puede depurar un ítem cuando la orden de compra está Demorada.',
                ]);
            }

            $cantidadDepurada = (int) $data['cantidad_depurada'];
            $totalDepurado = (int) $referencia->cantidad_depurada + $cantidadDepurada;
            $totalExplicado = (int) $referencia->cantidad_recibida + $totalDepurado;

            if ($totalExplicado > (int) $referencia->cantidad) {
                throw ValidationException::withMessages([
                    'cantidad_depurada' => 'La cantidad a depurar supera el saldo pendiente de esta línea.',
                ]);
            }

            $referencia->update([
                'cantidad_depurada' => $totalDepurado,
                'motivo_depuracion' => $data['motivo_depuracion'],
                'depurado_por' => $usuario->id,
                'depurado_at' => now(),
            ]);

            return $referencia->refresh();
        });
    }
}
