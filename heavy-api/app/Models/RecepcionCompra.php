<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $orden_trabajo_id
 * @property int $orden_compra_id
 * @property int $recibido_por
 * @property Carbon $fecha_recepcion
 * @property string|null $numero_remision
 * @property string|null $observaciones
 * @property string $estado
 * @property int|null $anulada_por
 * @property Carbon|null $fecha_anulacion
 * @property string|null $motivo_anulacion
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read OrdenTrabajo|null $ordenTrabajo
 * @property-read OrdenCompra $ordenCompra
 * @property-read User $recibidoPor
 * @property-read User|null $anuladaPor
 * @property-read Collection|RecepcionCompraDetalle[] $detalles
 * @property-read Collection|RecepcionCompraImagen[] $imagenes
 */
class RecepcionCompra extends Model
{
    use HasFactory;

    public const ESTADO_ACTIVA = 'Activa';

    public const ESTADO_ANULADA = 'Anulada';

    protected $table = 'recepciones_compra';

    protected $fillable = [
        'orden_trabajo_id',
        'orden_compra_id',
        'recibido_por',
        'fecha_recepcion',
        'numero_remision',
        'observaciones',
        'estado',
        'anulada_por',
        'fecha_anulacion',
        'motivo_anulacion',
    ];

    protected $casts = [
        'fecha_recepcion' => 'datetime',
        'fecha_anulacion' => 'datetime',
    ];

    public function ordenTrabajo(): BelongsTo
    {
        return $this->belongsTo(OrdenTrabajo::class, 'orden_trabajo_id');
    }

    public function ordenCompra(): BelongsTo
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function recibidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recibido_por');
    }

    public function anuladaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'anulada_por');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(RecepcionCompraDetalle::class, 'recepcion_compra_id');
    }

    public function imagenes(): HasMany
    {
        return $this->hasMany(RecepcionCompraImagen::class, 'recepcion_compra_id');
    }

    public function estaActiva(): bool
    {
        return $this->estado === self::ESTADO_ACTIVA;
    }
}
