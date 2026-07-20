<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $recepcion_compra_id
 * @property int $orden_compra_detalle_id
 * @property int $cantidad_recibida
 * @property int $cantidad_conforme
 * @property int $cantidad_rechazada
 * @property string|null $motivo_rechazo
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read RecepcionCompra $recepcionCompra
 * @property-read OrdenCompraReferencia $ordenCompraDetalle
 */
class RecepcionCompraDetalle extends Model
{
    use HasFactory;

    protected $table = 'recepcion_compra_detalles';

    protected $fillable = [
        'recepcion_compra_id',
        'orden_compra_detalle_id',
        'cantidad_recibida',
        'cantidad_conforme',
        'cantidad_rechazada',
        'motivo_rechazo',
    ];

    protected $casts = [
        'cantidad_recibida' => 'integer',
        'cantidad_conforme' => 'integer',
        'cantidad_rechazada' => 'integer',
    ];

    public function recepcionCompra(): BelongsTo
    {
        return $this->belongsTo(RecepcionCompra::class, 'recepcion_compra_id');
    }

    public function ordenCompraDetalle(): BelongsTo
    {
        return $this->belongsTo(OrdenCompraReferencia::class, 'orden_compra_detalle_id');
    }
}
