<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\OrdenTrabajoReferenciaActualizada;
use App\Models\OrdenTrabajoReferencia;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Gestiona la depuracion de faltantes definitivos en items de una Orden de
 * Trabajo (repuestos que un proveedor no podra reponer). No se factura al
 * cliente lo depurado.
 */
class OrdenTrabajoDepuracionService
{
    /**
     * @var array<int, string>
     */
    private const ESTADOS_OT_BLOQUEADOS = ['Completado', 'Cancelado'];

    /**
     * @param  array<string, mixed>  $data
     */
    public function depurarFaltante(OrdenTrabajoReferencia $referencia, array $data, User $usuario): OrdenTrabajoReferencia
    {
        return DB::transaction(function () use ($referencia, $data, $usuario): OrdenTrabajoReferencia {
            $referencia->loadMissing('ordenTrabajo');

            if (in_array($referencia->ordenTrabajo?->estado, self::ESTADOS_OT_BLOQUEADOS, true)) {
                throw ValidationException::withMessages([
                    'orden_trabajo' => 'No se puede depurar un ítem de una orden de trabajo cerrada o cancelada.',
                ]);
            }

            $cantidadDepurada = (int) $data['cantidad_depurada'];
            $totalDepurado = (int) $referencia->cantidad_depurada + $cantidadDepurada;
            $totalExplicado = (int) $referencia->cantidad_recibida + $totalDepurado;

            if ($totalExplicado > (int) $referencia->cantidad_cotizada) {
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

            OrdenTrabajoReferenciaActualizada::dispatch($referencia->ordenTrabajo);

            return $referencia->refresh();
        });
    }
}
