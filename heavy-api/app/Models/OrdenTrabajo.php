<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo OrdenTrabajo
 *
 * Representa una orden de trabajo generada a partir de un pedido o cotización.
 * Una orden de trabajo puede tener múltiples referencias asociadas.
 *
 * @property int $id
 * @property int|null $user_id
 * @property int|null $tercero_id
 * @property int|null $pedido_id
 * @property int|null $cotizacion_id
 * @property string|null $estado
 * @property \Illuminate\Support\Carbon|null $fecha_ingreso
 * @property \Illuminate\Support\Carbon|null $fecha_entrega
 * @property int|null $direccion_id
 * @property string|null $telefono
 * @property string|null $observaciones
 * @property string|null $guia
 * @property int|null $transportadora_id
 * @property string|null $archivo
 * @property string|null $motivo_cancelacion
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\User|null $user
 * @property-read \App\Models\Tercero|null $tercero
 * @property-read \App\Models\Pedido|null $pedido
 * @property-read \App\Models\Cotizacion|null $cotizacion
 * @property-read \App\Models\Transportadora|null $transportadora
 * @property-read \App\Models\Direccion|null $direccion
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\OrdenTrabajoReferencia[] $referencias
 */
class OrdenTrabajo extends Model
{
    use HasFactory;

    protected $table = 'orden_trabajos';

    protected $fillable = [
        'user_id',
        'tercero_id',
        'pedido_id',
        'cotizacion_id',
        'estado',
        'fecha_ingreso',
        'fecha_entrega',
        'direccion_id',
        'telefono',
        'observaciones',
        'guia',
        'transportadora_id',
        'archivo',
        'motivo_cancelacion',
    ];

    protected $casts = [
        'fecha_ingreso' => 'datetime',
        'fecha_entrega' => 'datetime',
    ];

    /**
     * Relación con el usuario que creó la orden
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
     * Relación con la cotización origen
     */
    public function cotizacion(): BelongsTo
    {
        return $this->belongsTo(Cotizacion::class);
    }

    /**
     * Relación con la transportadora
     */
    public function transportadora(): BelongsTo
    {
        return $this->belongsTo(Transportadora::class);
    }

    /**
     * Relación con la dirección
     */
    public function direccion(): BelongsTo
    {
        return $this->belongsTo(Direccion::class);
    }

    /**
     * Relación con las referencias de la orden de trabajo
     */
    public function referencias(): HasMany
    {
        return $this->hasMany(OrdenTrabajoReferencia::class);
    }
}
