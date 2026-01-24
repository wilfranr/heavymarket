<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Cotizacion
 *
 * Representa una cotización generada a partir de un pedido.
 * Una cotización puede tener múltiples referencias con proveedores asociados.
 *
 * @property int $id
 * @property int $user_id
 * @property int $tercero_id
 * @property int $pedido_id
 * @property string $estado
 * @property \Illuminate\Support\Carbon|null $fecha_emision
 * @property \Illuminate\Support\Carbon|null $fecha_vencimiento
 * @property string|null $observaciones
 * @property float|null $total
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User $user
 * @property-read \App\Models\Tercero $tercero
 * @property-read \App\Models\Pedido $pedido
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\CotizacionReferenciaProveedor[] $referenciasProveedores
 */
class Cotizacion extends Model
{
    use HasFactory;

    protected $table = 'cotizaciones';

    protected $fillable = [
        'user_id',
        'tercero_id',
        'pedido_id',
        'estado',
        'fecha_emision',
        'fecha_vencimiento',
        'observaciones',
        'total',
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'fecha_vencimiento' => 'datetime',
        'total' => 'float',
    ];

    /**
     * Relación con el usuario que creó la cotización
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el tercero (cliente)
     */
    public function tercero(): BelongsTo
    {
        return $this->belongsTo(Tercero::class);
    }

    /**
     * Relación con el pedido origen
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    /**
     * Relación con las referencias y proveedores de la cotización
     */
    public function referenciasProveedores(): HasMany
    {
        return $this->hasMany(CotizacionReferenciaProveedor::class);
    }
}
